import { BaseAgent, AgentResult } from "./base-agent";
import { ReportingService } from "@/lib/services/reporting-service";

export class SalesAgent extends BaseAgent {
    canHandle(prompt: string): boolean {
        const keywords = ["sales", "invoice", "order", "customer", "revenue", "selling", "quote", "top customer"];
        return keywords.some(k => prompt.toLowerCase().includes(k));
    }

    async execute(prompt: string): Promise<AgentResult> {
        const salesData = await ReportingService.getSalesAnalysis(this.context.companyId);
        
        if (prompt.toLowerCase().includes("total sales") || prompt.toLowerCase().includes("how much")) {
             const total = Number(salesData.summary.total || 0);
             const count = Number(salesData.summary.count || 0);
             return {
                answer: `Total issued sales: **AED ${total.toLocaleString()}** across **${count}** orders.`,
                data: salesData.summary,
                citations: ["sales_orders"]
            };
        }
        
        if (prompt.toLowerCase().includes("top customer")) {
            const top = salesData.topCustomers[0]; 
             return {
                answer: top 
                    ? `Your top customer is **${top.name}** with **AED ${Number(top.value).toLocaleString()}** in sales.`
                    : "No customer sales data available yet.",
                data: salesData.topCustomers,
                citations: ["sales_orders", "customers"]
            };
        }
        
        // Generic Sales Help
        return {
            answer: `I found ${Number(salesData.summary.count || 0)} issued orders totaling AED ${Number(salesData.summary.total || 0).toLocaleString()}. Ask about 'total sales' or 'top customer'.`,
            data: salesData.summary
        };
    }
}
