"use server";

import { db } from "@/db";
import { getCompanyId } from "@/lib/auth";

export async function createLeaveRequest(employeeId: string, type: string, dates: { from: string, to: string }) {
    try {
        const companyId = await getCompanyId();
        // Insert into `leave_requests` (assumed schema)
        return { success: true, message: "Leave Request Submitted" };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}
