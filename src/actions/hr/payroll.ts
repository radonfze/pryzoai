"use server";

import { processPayrollRun as serviceProcess } from "@/lib/services/payroll-engine";
import { revalidatePath } from "next/cache";

export async function processPayrollRun(month: number, year: number) {
    const res = await serviceProcess(month, year);
    if (res.success) {
        revalidatePath("/hr/payroll");
    }
    return res;
}
