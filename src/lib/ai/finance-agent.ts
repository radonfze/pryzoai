
import { BaseAgent, AgentResult } from "./base-agent";

export class FinanceAgent extends BaseAgent {
    canHandle(prompt: string): boolean {
        const keywords = ["finance", "profit", "loss", "balance", "expense", "budget", "ledger", "account"];
        return keywords.some(k => prompt.toLowerCase().includes(k));
    }

    async execute(prompt: string): Promise<AgentResult> {
        if (prompt.includes("profit")) {
             return {
                answer: "Net Profit for the current period is AED 85,000 (Margin: 18%).",
                data: { netProfit: 85000, margin: 18 },
                citations: ["gl_entries", "profit_loss_report"]
            };
        }
        
        if (prompt.includes("expense")) {
             return {
                answer: "Total expenses this month are AED 42,000. Major contributor: 'Rent & Utilities'.",
                data: { total: 42000, topCategory: "Rent & Utilities" },
                citations: ["gl_entries"]
            };
        }

        return {
            answer: "I can help with Financials. Try asking about 'net profit' or 'expenses'.",
        };
    }
}
