"use server";

import { db } from "@/db";
import { getCompanyId } from "@/lib/auth";

/**
 * AI AGENT SERVICE (Phase 14)
 * Handles Natural Language Queries (NLQ) and RLS-aware data retrieval.
 */


import { SalesAgent } from "@/lib/ai/sales-agent";
import { FinanceAgent } from "@/lib/ai/finance-agent";
import { HRAgent } from "@/lib/ai/hr-agent";
import { AgentContext } from "@/lib/ai/base-agent";

export async function queryAgent(prompt: string, context: string = "general"): Promise<AgentResponse> {
    try {
        const companyId = await getCompanyId();
        
        // Mock Context (In real app, fetch from session)
        const agentContext: AgentContext = {
            companyId,
            userId: "user_123",
            role: "admin" // Mock role
        };

        const agents = [
            new SalesAgent(agentContext),
            new FinanceAgent(agentContext),
            new HRAgent(agentContext)
        ];

        // 1. Safety Check
        const blockedTerms = ["drop table", "confidential", "password", "secret"];
        if (blockedTerms.some(term => prompt.toLowerCase().includes(term))) {
            return { answer: "I cannot fulfill this request due to safety policies." };
        }

        // 2. Route to Expert Agent
        const matchedAgent = agents.find(web => web.canHandle(prompt));
        
        if (matchedAgent) {
            return await matchedAgent.execute(prompt);
        }

        // 3. Fallback / General
        return {
            answer: "I understood your query, but it doesn't match a specific domain (Sales, HR, Finance). Try being more specific.",
        };

    } catch (e: any) {
        return { answer: "An error occurred processing your request." };
    }
}

