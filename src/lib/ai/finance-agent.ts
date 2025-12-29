import { BaseAgent, AgentResult } from "./base-agent";
import { ReportingService } from "@/lib/services/reporting-service";

export class FinanceAgent extends BaseAgent {
    canHandle(prompt: string): boolean {
        const keywords = ["finance", "profit", "loss", "balance", "expense", "budget", "ledger", "account", "p&l", "pnl"];
        return keywords.some(k => prompt.toLowerCase().includes(k));
    }

    async execute(prompt: string): Promise<AgentResult> {
        const pnl = await ReportingService.getProfitAndLoss(this.context.companyId);
        
        if (prompt.toLowerCase().includes("profit") || prompt.toLowerCase().includes("p&l") || prompt.toLowerCase().includes("pnl")) {
             return {
                answer: `Net Profit is **AED ${pnl.netProfit.toLocaleString()}**. Revenue: AED ${pnl.revenue.total.toLocaleString()}, Expenses: AED ${pnl.expense.total.toLocaleString()}.`,
                data: pnl,
                citations: ["chart_of_accounts"]
            };
        }
        
        if (prompt.toLowerCase().includes("expense")) {
             return {
                answer: `Total expenses are **AED ${pnl.expense.total.toLocaleString()}**.`,
                data: { total: pnl.expense.total, accounts: pnl.expense.accounts },
                citations: ["chart_of_accounts"]
            };
        }
        
        if (prompt.toLowerCase().includes("revenue")) {
             return {
                answer: `Total revenue is **AED ${pnl.revenue.total.toLocaleString()}**.`,
                data: { total: pnl.revenue.total, accounts: pnl.revenue.accounts },
                citations: ["chart_of_accounts"]
            };
        }

        return {
            answer: "I can help with Financials. Try asking about 'profit and loss', 'expenses', or 'revenue'.",
        };
    }
}
