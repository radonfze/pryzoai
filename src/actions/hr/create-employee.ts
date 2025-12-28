"use server";

import { db } from "@/db";
import { 
  employees, 
  numberSeries 
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ActionResponse = { success: boolean; message: string; data?: any };

export type EmployeeInput = {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    department?: string;
    designation?: string;
    dateOfJoining: string;
    basicSalary: number;
};

export async function createEmployeeAction(input: EmployeeInput): Promise<ActionResponse> {
    try {
        const DEMO_COMPANY_ID = "00000000-0000-0000-0000-000000000000";

        if (!input.firstName || !input.email || !input.basicSalary) {
             return { success: false, message: "Name, Email, Salary required" };
        }

        // 1. Generate Employee Code
        const series = await db.query.numberSeries.findFirst({
            where: and(
                eq(numberSeries.companyId, DEMO_COMPANY_ID),
                eq(numberSeries.entityType, "employee"), 
                eq(numberSeries.isActive, true)
            )
        });

        let empCode = `EMP-${Date.now()}`;
        if (series) {
            const nextVal = (series.currentValue || 0) + 1;
            empCode = `${series.prefix}-${nextVal.toString().padStart(4, '0')}`;
            await db.update(numberSeries).set({ currentValue: nextVal }).where(eq(numberSeries.id, series.id));
        }

        const [newEmp] = await db.insert(employees).values({
            companyId: DEMO_COMPANY_ID,
            employeeCode: empCode,
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
            phone: input.phone,
            department: input.department,
            designation: input.designation,
            joiningDate: new Date(input.dateOfJoining),
            basicSalary: input.basicSalary.toString(),
            status: "active"
        }).returning();

        revalidatePath("/hr/employees");
        return { success: true, message: `Employee ${empCode} created`, data: { id: newEmp.id } };

    } catch (error: any) {
        console.error("Create Employee Error:", error);
         return { success: false, message: error.message };
    }
}
