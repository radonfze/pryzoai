
import { BaseAgent, AgentResult } from "./base-agent";

export class SalesAgent extends BaseAgent {
    canHandle(prompt: string): boolean {
        const keywords = ["sales", "invoice", "order", "customer", "revenue", "selling", "quote"];
        return keywords.some(k => prompt.toLowerCase().includes(k));
    }

    async execute(prompt: string): Promise<AgentResult> {
        // Mock Implementation logic for V120
        // Ideally this would use an LLM or SQL generation based on schema
        
        if (prompt.includes("last month")) {
             return {
                answer: "Total sales for last month: AED 125,000 across 45 Invoices.",
                data: { total: 125000, count: 45 },
                citations: ["sales_invoices"]
            };
        }
        
        if (prompt.includes("top customer")) {
             return {
                answer: "Your top customer is 'Al Futtaim Group' with AED 450,000 YTD.",
                data: { customer: "Al Futtaim Group", amount: 450000 },
                citations: ["customers", "sales_invoices"]
            };
        }

        return {
            answer: "I can help with Sales data. Try asking about 'last month sales' or 'top customers'.",
        };
    }
}
