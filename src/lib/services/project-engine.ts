"use server";

import { db } from "@/db";
import { projects, amcContracts, amcVisits, projectTasks } from "@/db/schema";
import { getCompanyId } from "@/lib/auth";
import { addMonths, addDays } from "date-fns";

export interface CreateProjectParams {
    type: "installation" | "amc" | "time_material";
    code: string;
    name: string;
    customerId: string;
    startDate: Date;
    endDate?: Date;
    managerId?: string;
    // AMC Specific
    contractValue?: number;
    visitFrequency?: "monthly" | "quarterly" | "yearly";
}

/**
 * Unified Project Creation Engine
 * Handles Installation (Milestones) and AMC (Contract + Visits) setup.
 */
export async function createUnifiedProject(params: CreateProjectParams) {
    try {
        const companyId = await getCompanyId();

        // 1. Create Base Project
        const [project] = await db.insert(projects).values({
            companyId,
            customerId: params.customerId,
            projectCode: params.code,
            projectName: params.name,
            startDate: params.startDate.toISOString(),
            endDate: params.endDate?.toISOString(),
            projectManagerId: params.managerId,
            status: "active"
        }).returning();

        // 2. Handle AMC Specifics
        if (params.type === "amc") {
            if (!params.endDate) throw new Error("End Date required for AMC");
            
            // Create Contract
            const [contract] = await db.insert(amcContracts).values({
                companyId,
                customerId: params.customerId, // Using project customer
                contractNumber: `AMC-${params.code}`,
                contractName: `${params.name} Contract`,
                startDate: params.startDate.toISOString(),
                endDate: params.endDate.toISOString(),
                contractValue: params.contractValue?.toString() || "0",
                visitFrequency: params.visitFrequency || "monthly",
                status: "active"
            }).returning();

            // Auto-Schedule Visits (Basic Logic)
            await generateAmcVisits(contract.id, params.startDate, params.endDate, params.visitFrequency || "monthly");
        } 
        else if (params.type === "installation") {
            // Create Default Phases
            await db.insert(projectTasks).values([
                { companyId, projectId: project.id, taskCode: "PH-01", taskName: "Design/Planning", status: "pending" },
                { companyId, projectId: project.id, taskCode: "PH-02", taskName: "Execution", status: "pending" },
                { companyId, projectId: project.id, taskCode: "PH-03", taskName: "Testing & Commissioning", status: "pending" },
                { companyId, projectId: project.id, taskCode: "PH-04", taskName: "Handover", status: "pending" }
            ]);
        }

        return { success: true, projectId: project.id, message: "Project created successfully" };

    } catch(e: any) {
        return { success: false, message: e.message };
    }
}

async function generateAmcVisits(contractId: string, start: Date, end: Date, freq: string) {
    const companyId = await getCompanyId();
    const visits = [];
    let current = new Date(start);
    let count = 1;

    while (current <= end) {
        visits.push({
            companyId,
            contractId,
            visitNumber: `V-${count.toString().padStart(3, '0')}`,
            scheduledDate: current.toISOString(),
            status: "scheduled"
        });

        // Increment
        if (freq === "monthly") current = addMonths(current, 1);
        else if (freq === "quarterly") current = addMonths(current, 3);
        else if (freq === "yearly") current = addMonths(current, 12);
        else current = addMonths(current, 1); // Default
        
        count++;
    }

    if (visits.length > 0) {
        await db.insert(amcVisits).values(visits);
        // Update contract total visits
        await db.update(amcContracts).set({ totalVisits: visits.length }).where({ id: contractId } as any); // Type assertion for partial match
    }
}
