"use server";

import { db } from "@/db";
import { 
  timeEntries, 
  projectTasks, 
  projects 
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ActionResponse = { success: boolean; message: string; data?: any };

export type TimeEntryInput = {
    projectId: string;
    taskId?: string; // Optional
    employeeId: string; // If applicable, or userId
    date: string;
    hours: number;
    description?: string;
    billable: boolean;
};

export async function logTimeAction(input: TimeEntryInput): Promise<ActionResponse> {
    try {
        const DEMO_COMPANY_ID = "00000000-0000-0000-0000-000000000000";

        if (!input.projectId || !input.hours) {
            return { success: false, message: "Project and hours are required" };
        }

        const [entry] = await db.insert(timeEntries).values({
            companyId: DEMO_COMPANY_ID,
            projectId: input.projectId,
            taskId: input.taskId,
            employeeId: input.employeeId,
            date: new Date(input.date),
            hours: input.hours.toString(),
            description: input.description,
            isBillable: input.billable,
            status: "approved" // auto-approve for now
        }).returning();

        revalidatePath("/projects/time");
        return { success: true, message: "Time logged successfully", data: { id: entry.id } };

    } catch (error: any) {
        console.error("Log Time Error:", error);
        return { success: false, message: error.message };
    }
}
