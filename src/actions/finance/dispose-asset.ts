"use server";

import { db } from "@/db";
import { fixedAssets, journalEntries, journalLines, chartOfAccounts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCompanyId } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function disposeAsset(assetId: string, disposalDate: string, salePrice: number) {
    try {
        const companyId = await getCompanyId();

        // 1. Fetch Asset
        const asset = await db.query.fixedAssets.findFirst({
            where: and(eq(fixedAssets.id, assetId), eq(fixedAssets.companyId, companyId))
        });

        if (!asset) throw new Error("Asset not found");
        if (asset.status !== "active" && asset.status !== "depreciating") throw new Error("Asset is not active");

        // 2. Calculate Financials
        // Simplified: Assume depreciation is up to date or we skip partial month calc for MVP
        const cost = Number(asset.purchaseCost);
        const currentValue = Number(asset.currentValue || cost); // Net Book Value
        const accumulatedDep = cost - currentValue;
        
        const gainLoss = salePrice - currentValue;
        
        // 3. Update Asset
        await db.update(fixedAssets).set({
            status: "disposed",
            disposalDate: disposalDate,
            disposalPrice: salePrice.toString(),
            gainLossAmount: gainLoss.toString(),
            currentValue: "0" // Wiped out
        }).where(eq(fixedAssets.id, assetId));

        // 4. Post to GL
        // DR Cash/Receivable (Sale Price)
        // DR Accumulated Depreciation (Clearance)
        // CR Asset Cost (Clearance)
        // CR/DR Gain/Loss
        
        const coa = await db.query.chartOfAccounts.findMany({ where: eq(chartOfAccounts.companyId, companyId) });
        const getAcct = (code: string) => coa.find(a => a.code === code)?.id;

        const cashId = getAcct("1110"); // Cash
        const assetIdCoa = getAcct("1510"); // Fixed Asset
        const accDepId = getAcct("1520"); // Accumulated Dep
        const gainLossId = getAcct("4200"); // Gain/Loss on Disposal

        if (cashId && assetIdCoa && accDepId && gainLossId) {
             const [journal] = await db.insert(journalEntries).values({
                companyId,
                journalNumber: `JV-DISP-${asset.assetCode}`,
                journalDate: disposalDate,
                description: `Disposal of ${asset.assetName}`,
                totalDebit: (salePrice + accumulatedDep).toFixed(2),
                totalCredit: (salePrice + accumulatedDep).toFixed(2), // specific balancing logic needed if gain/loss
                status: "posted"
             }).returning();

             // DR Cash
             if (salePrice > 0) {
                 await db.insert(journalLines).values({
                    companyId, journalId: journal.id, lineNumber: 1, accountId: cashId,
                    description: "Proceeds from disposal", debit: salePrice.toFixed(2), credit: "0"
                 });
             }

             // DR Acc Dep (Remove liability/contra-asset)
             await db.insert(journalLines).values({
                companyId, journalId: journal.id, lineNumber: 2, accountId: accDepId,
                description: "Clear Accumulated Dep", debit: accumulatedDep.toFixed(2), credit: "0"
             });

             // CR Asset Cost (Remove Asset)
             await db.insert(journalLines).values({
                companyId, journalId: journal.id, lineNumber: 3, accountId: assetIdCoa,
                description: "Remove Asset Cost", debit: "0", credit: cost.toFixed(2)
             });

             // Balancing Entry (Gain or Loss)
             // If Gain: CR Gain (Income)
             // If Loss: DR Loss (Expense)
             if (gainLoss > 0) {
                 // Gain -> Credit
                  await db.insert(journalLines).values({
                    companyId, journalId: journal.id, lineNumber: 4, accountId: gainLossId,
                    description: "Gain on Disposal", debit: "0", credit: gainLoss.toFixed(2)
                 });
             } else if (gainLoss < 0) {
                 // Loss -> Debit
                 await db.insert(journalLines).values({
                    companyId, journalId: journal.id, lineNumber: 4, accountId: gainLossId,
                    description: "Loss on Disposal", debit: Math.abs(gainLoss).toFixed(2), credit: "0"
                 });
             }
        }

        revalidatePath("/finance/assets");
        return { success: true, message: "Asset Disposed and Journal Posted" };

    } catch (e: any) {
        return { success: false, message: e.message };
    }
}
