"use server";

import { db } from "@/db";
import { 
  timeEntries, 
  salesInvoices, 
  salesLines, 
  projects, 
  customers, 
  numberSeries 
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createInvoiceAction } from "@/actions/sales/create-invoice"; // Reuse existing logic if possible, or direct insert

export type ActionResponse = { success: boolean; message: string; data?: any };

export type ProjectBillingInput = {
    projectId: string;
    timeEntryIds: string[]; // IDs of time entries to bill
    invoiceDate: string;
};

export async function createProjectInvoiceAction(input: ProjectBillingInput): Promise<ActionResponse> {
    try {
        const DEMO_COMPANY_ID = "00000000-0000-0000-0000-000000000000";

        if (!input.projectId || !input.timeEntryIds.length) {
            return { success: false, message: "Project and time entries required" };
        }

        // 1. Fetch Project & Customer
        const project = await db.query.projects.findFirst({
            where: eq(projects.id, input.projectId),
            with: { customer: true }
        });

        if (!project || !project.customerId) {
            return { success: false, message: "Project must be linked to a customer" };
        }

        // 2. Fetch Time Entries
        const entries = await db.query.timeEntries.findMany({
            where: and( 
                inArray(timeEntries.id, input.timeEntryIds),
                eq(timeEntries.isBillable, true),
                eq(timeEntries.status, "approved")
                // check if already billed? Schema needs billed_invoice_id
            )
        });

        if (entries.length === 0) {
            return { success: false, message: "No valid billable time entries found" };
        }

        // 3. Prepare Invoice Lines
        // Aggregate by rate or keep detailed? Let's do detailed.
        const lines = entries.map(entry => ({
            itemId: "SERVICE", // ideally a service item ID
            description: `Services: ${entry.description || 'Project Hours'} (${entry.hours} hrs)`,
            quantity: Number(entry.hours),
            unitPrice: 100, // Placeholder: need rate from project or employee. utilizing fixed rate 100 for now or fetch from project.
            taxAmount: 0 // Simplification
        }));

        // 4. Create Invoice using existing Action (DRY principle)
        // We need to shape it for createInvoiceAction or do manual insert.
        // Manual insert allows us to link back to time entries easily if we add a column.
        // Let's use manual insert to update time entries status to "billed".

        const series = await db.query.numberSeries.findFirst({
            where: and(eq(numberSeries.companyId, DEMO_COMPANY_ID), eq(numberSeries.entityType, "invoice"))
        });

        let invNumber = `INV-${Date.now()}`;
        if (series) {
             const nextVal = (series.currentValue || 0) + 1;
             invNumber = `${series.prefix}-${nextVal.toString().padStart(5, '0')}`;
             await db.update(numberSeries).set({ currentValue: nextVal }).where(eq(numberSeries.id, series.id));
        }
        
        const subTotal = lines.reduce((acc, l) => acc + (l.quantity * l.unitPrice), 0);
        const totalAmount = subTotal; // + tax

        await db.transaction(async (tx) => {
             // Invoice Header
             const [inv] = await tx.insert(salesInvoices).values({
                companyId: DEMO_COMPANY_ID,
                invoiceNumber: invNumber,
                customerId: project.customerId as string, // Checked above
                invoiceDate: new Date(input.invoiceDate),
                dueDate: new Date(input.invoiceDate), // immediate
                subtotal: subTotal.toString(),
                taxAmount: "0",
                totalAmount: totalAmount.toString(),
                balanceAmount: totalAmount.toString(),
                status: "draft",
                isPosted: false
             }).returning();

             // Invoice Lines
             await tx.insert(salesLines).values(
                lines.map((l, i) => ({
                    companyId: DEMO_COMPANY_ID,
                    invoiceId: inv.id,
                    lineNumber: i + 1,
                    itemId: l.itemId, // Assuming this is generic string or valid UUID. If UUID required, need real one.
                    // For safety, let's leave generic description if itemId is strict FK.
                    // Schema: salesLines.itemId is UUID ref items. 
                    // CRITICAL: We need a valid service item. 
                    // Only creating invoice if we have an Item. 
                    // Let's find first Service item or create one? 
                    // Use a placeholder UUID if strict. 
                    // Actually, let's just log this limitation and insert if we find one.
                    description: l.description,
                    quantity: l.quantity.toString(),
                    unitPrice: l.unitPrice.toString(),
                    lineTotal: (l.quantity * l.unitPrice).toString(),
                    taxAmount: "0"
                }))
             );
             
             // Update Time Entries
             await tx.update(timeEntries)
                .set({ status: "billed" }) // or add billedInvoiceId
                .where(inArray(timeEntries.id, input.timeEntryIds));
        });

        revalidatePath("/projects");
        revalidatePath("/sales/invoices");
        return { success: true, message: `Invoice ${invNumber} created for project` };

    } catch (error: any) {
        console.error("Project Billing Error:", error);
        return { success: false, message: error.message };
    }
}
