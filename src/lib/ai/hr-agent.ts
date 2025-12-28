
import { BaseAgent, AgentResult } from "./base-agent";

export class HRAgent extends BaseAgent {
    canHandle(prompt: string): boolean {
        const keywords = ["hr", "employee", "leave", "salary", "payroll", "attendance", "staff"];
        return keywords.some(k => prompt.toLowerCase().includes(k));
    }

    async execute(prompt: string): Promise<AgentResult> {
        // Sensitive data check
        if (this.context.role !== "admin" && this.context.role !== "hr_manager") {
            if (prompt.includes("salary")) {
                 return {
                    answer: "Access Denied: You do not have permission to view salary information.",
                };
            }
        }

        if (prompt.includes("leave")) {
             return {
                answer: "There are 4 employees on leave today.",
                data: { count: 4, names: ["John Doe", "Jane Smith"] },
                citations: ["leave_applications"]
            };
        }
        
        return {
            answer: "I can help with HR. Try asking about 'leaves' or 'attendance'.",
        };
    }
}
