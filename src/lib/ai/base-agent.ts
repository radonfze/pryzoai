export interface AgentContext {
    companyId: string;
    userId: string;
    role: string;
}

export interface AgentResult {
    answer: string;
    data?: any;
    citations?: string[];
}

export abstract class BaseAgent {
    protected context: AgentContext;

    constructor(context: AgentContext) {
        this.context = context;
    }

    abstract canHandle(prompt: string): boolean;
    abstract execute(prompt: string): Promise<AgentResult>;
}
