"use server";

import { db } from "@/db";
import { journalLines, chartOfAccounts, companies } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getCompanyId } from "@/lib/auth";

type ReportType = "balance_sheet" | "profit_loss" | "trial_balance";

export async function getFinancialReport(type: ReportType, endDate: string) {
    try {
        const companyId = await getCompanyId();

        // Fetch all account balances sourced from Journal Lines
        // Simple aggregation engine
        const balances = await db
            .select({
                accountId: journalLines.accountId,
                accountName: chartOfAccounts.name,
                accountCode: chartOfAccounts.code,
                accountType: chartOfAccounts.accountType, // asset, liability, equity, income, expense
                totalDebit: sql<number>`sum(${journalLines.debit})`,
                totalCredit: sql<number>`sum(${journalLines.credit})`,
            })
            .from(journalLines)
            .leftJoin(chartOfAccounts, eq(journalLines.accountId, chartOfAccounts.id))
            .where(eq(journalLines.companyId, companyId))
            .groupBy(journalLines.accountId, chartOfAccounts.name, chartOfAccounts.code, chartOfAccounts.accountType);

        // Process based on Report Type
        const reportData = balances.map(b => {
            const dr = Number(b.totalDebit || 0);
            const cr = Number(b.totalCredit || 0);
            let net = 0;

            // Normal Balance Logic
            if (["asset", "expense"].includes(b.accountType || "")) {
                net = dr - cr;
            } else {
                net = cr - dr;
            }

            return { ...b, netBalance: net };
        });

        // Filter Logic
        let filteredData = reportData;
        if (type === "balance_sheet") {
            filteredData = reportData.filter(d => ["asset", "liability", "equity"].includes(d.accountType || ""));
        } else if (type === "profit_loss") {
            filteredData = reportData.filter(d => ["income", "expense"].includes(d.accountType || ""));
        }

        // Calculate Totals
        const totalAssets = filteredData.filter(d => d.accountType === "asset").reduce((sum, d) => sum + d.netBalance, 0);
        const totalLiabilities = filteredData.filter(d => d.accountType === "liability").reduce((sum, d) => sum + d.netBalance, 0);
        const totalEquity = filteredData.filter(d => d.accountType === "equity").reduce((sum, d) => sum + d.netBalance, 0);
        const totalIncome = filteredData.filter(d => d.accountType === "income").reduce((sum, d) => sum + d.netBalance, 0);
        const totalExpense = filteredData.filter(d => d.accountType === "expense").reduce((sum, d) => sum + d.netBalance, 0);

        return {
            success: true,
            type,
            asOf: endDate,
            data: filteredData.sort((a,b) => (a.accountCode || "").localeCompare(b.accountCode || "")),
            summary: {
                totalAssets,
                totalLiabilities,
                totalEquity,
                totalIncome,
                totalExpense,
                netIncome: totalIncome - totalExpense
            }
        };

    } catch (e: any) {
        return { success: false, message: e.message };
    }
}
