"use server";

import { db } from "@/db";
import { employees } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache"; 
import { getCompanyId } from "@/lib/auth";

export async function updateEmployee(id: string, data: any) {
    try {
        const companyId = await getCompanyId();
        await db.update(employees).set({
            ...data,
            // Ensure numeric fields are parsed
            basicSalary: data.basicSalary ? data.basicSalary.toString() : undefined,
            housingAllowance: data.housingAllowance ? data.housingAllowance.toString() : undefined,
            transportAllowance: data.transportAllowance ? data.transportAllowance.toString() : undefined,
            otherAllowance: data.otherAllowance ? data.otherAllowance.toString() : undefined,
        }).where(and(eq(employees.id, id), eq(employees.companyId, companyId)));
        
        revalidatePath("/hr/employees");
        return { success: true, message: "Employee details updated" };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}
