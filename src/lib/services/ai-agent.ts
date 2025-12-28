"use server";

import { db } from "@/db";
import { getCompanyId } from "@/lib/auth";

/**
 * AI AGENT SERVICE (Phase 14)
 * Handles Natural Language Queries (NLQ) and RLS-aware data retrieval.
 */

interface AgentResponse {
    answer: string;
    data?: any;
    citations?: string[];
}

export async function queryAgent(prompt: string, context: string = "general"): Promise<AgentResponse> {
    try {
        const companyId = await getCompanyId();
        
        // 1. Safety Check (Hardcoded Blocks)
        const blockedTerms = ["drop table", "confidential", "password", "secret"];
        if (blockedTerms.some(term => prompt.toLowerCase().includes(term))) {
            return { answer: "I cannot fulfill this request due to safety policies." };
        }

        // 2. Mock Reasoning Layer (In real implementation, calls LLM)
        // Here we simulate RLS-aware responses based on prompt keywords
        
        if (prompt.includes("sales") && prompt.includes("last month")) {
            // Mock SQL: SELECT sum(total) FROM invoices WHERE date > ... AND company_id = ?
            return {
                answer: "Total sales for last month were AED 45,230 based on 14 invoices.",
                data: { sales: 45230, count: 14 },
                citations: ["invoices_table"]
            };
        }

        if (prompt.includes("pending approvals")) {
            return {
                answer: "You have 3 pending purchase orders awaiting approval.",
                data: [ { id: "PO-001", amount: 5000 }, { id: "PO-002", amount: 1200 } ],
                citations: ["purchase_orders"]
            };
        }

        return {
            answer: "I understood your query, but I don't have live data access configured for this domain yet.",
        };

    } catch (e: any) {
        return { answer: "An error occurred processing your request." };
    }
}
