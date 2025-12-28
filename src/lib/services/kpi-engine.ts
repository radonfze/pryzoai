import { db } from "@/db";
import { kpiActuals, kpiTargets, kpiMaster, kpiScorecards } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function calculateKpiScore(actualValue: number, targetValue: number, direction: string = "higher") {
    let achievement = 0;
    
    if (targetValue === 0) return 0; // Avoid division by zero

    if (direction === "higher") {
        // Higher is better (e.g. Sales)
        achievement = (actualValue / targetValue) * 100;
    } else if (direction === "lower") {
        // Lower is better (e.g. Defects)
        // If actual <= target, 100% or more. 
        // Simple formula: (Target / Actual) * 100?? 
        // Or linear degradation? Let's use standard inverse:
        if (actualValue === 0) achievement = 100; // Perfect
        else achievement = (targetValue / actualValue) * 100;
    } else {
        // Target (Exact match is best) - Deviation penalizes
        const diff = Math.abs(actualValue - targetValue);
        const deviation = (diff / targetValue) * 100;
        achievement = Math.max(0, 100 - deviation);
    }

    return parseFloat(achievement.toFixed(2));
}

export async function updatePeriodScorecard(companyId: string, employeeId: string, fiscalYear: number, periodNumber: number) {
    // 1. Fetch all actuals for this employee/period
    const actuals = await db.query.kpiActuals.findMany({
        where: and(
            eq(kpiActuals.companyId, companyId),
            eq(kpiActuals.employeeId, employeeId),
            eq(kpiActuals.fiscalYear, fiscalYear),
            eq(kpiActuals.periodNumber, periodNumber)
        ),
        with: { kpi: true }
    });

    if (actuals.length === 0) return;

    let totalWeightedScore = 0;
    let totalWeight = 0;

    // 2. Calculate Weighted Score
    for (const record of actuals) {
        const weight = Number(record.kpi.weight || 1);
        const score = Number(record.achievementPercent || 0); // Cap at 100? or 120? Usually capped.
        const cappedScore = Math.min(score, 120); // Cap at 120% bonus

        totalWeightedScore += (cappedScore * weight);
        totalWeight += weight;
    }

    const finalScore = totalWeight > 0 ? (totalWeightedScore / totalWeight) : 0;
    
    let rating = "poor";
    if (finalScore >= 100) rating = "excellent";
    else if (finalScore >= 80) rating = "good";
    else if (finalScore >= 60) rating = "average";

    // 3. Upsert Scorecard
    // Check existing
    const existing = await db.query.kpiScorecards.findFirst({
        where: and(
            eq(kpiScorecards.companyId, companyId), 
            eq(kpiScorecards.employeeId, employeeId),
            eq(kpiScorecards.fiscalYear, fiscalYear),
            eq(kpiScorecards.periodNumber, periodNumber)
        )
    });

    if (existing) {
        await db.update(kpiScorecards).set({
            totalScore: finalScore.toString(),
            weightedScore: totalWeightedScore.toString(),
            overallRating: rating,
            updatedAt: new Date()
        }).where(eq(kpiScorecards.id, existing.id));
    } else {
        await db.insert(kpiScorecards).values({
            companyId,
            employeeId,
            fiscalYear,
            periodNumber,
            totalScore: finalScore.toString(),
            weightedScore: totalWeightedScore.toString(),
            overallRating: rating
        });
    }

    return { finalScore, rating };
}
