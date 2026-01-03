"use server";

import { db } from "@/db";
import { recurringInvoiceTemplates, recurringInvoiceLines } from "@/db/schema";
import { revalidatePath } from "next/cache";

type RecurringInvoiceInput = {
    templateName: string;
    customerId: string;
    frequency: "weekly" | "biweekly" | "monthly" | "quarterly" | "biannually" | "yearly";
    startDate: string;
    endDate?: string;
    dayOfMonth?: number;
    dayOfWeek?: number;
    notes?: string;
    autoPost: boolean;
    isActive: boolean;
    lines: {
        itemId: string;
        quantity: number;
        unitPrice: number;
        uom: string;
        discountPercent?: number;
        description?: string;
    }[];
};

export async function createRecurringInvoiceAction(input: RecurringInvoiceInput) {
    try {
        const companyId = "00000000-0000-0000-0000-000000000000";
        // Calculate totals
        let subtotal = 0;
        let totalTax = 0;

        const processedLines = input.lines.map((line, index) => {
             const qty = line.quantity;
             const price = line.unitPrice;
             const discPct = line.discountPercent || 0;
             
             const lineSubtotal = qty * price;
             const discAmount = lineSubtotal * (discPct / 100);
             const lineAfterDisc = lineSubtotal - discAmount;
             // Simple tax 5%
             const taxAmount = lineAfterDisc * 0.05;
             const lineTotal = lineAfterDisc + taxAmount;

             subtotal += lineAfterDisc;
             totalTax += taxAmount;

             return {
                 ...line,
                 lineNumber: index + 1,
                 taxAmount: taxAmount.toFixed(2),
                 lineTotal: lineTotal.toFixed(2)
             };
        });

        const grandTotal = subtotal + totalTax;

        // Determine next run date (simplified first logic)
        const nextRunDate = input.startDate;

        await db.transaction(async (tx) => {
             const [template] = await tx.insert(recurringInvoiceTemplates).values({
                 companyId,
                 customerId: input.customerId,
                 templateName: input.templateName,
                 frequency: input.frequency,
                 startDate: input.startDate,
                 endDate: input.endDate || null,
                 nextRunDate,
                 dayOfMonth: input.dayOfMonth || 1,
                 dayOfWeek: input.dayOfWeek || 0,
                 notes: input.notes,
                 autoPost: input.autoPost,
                 isActive: input.isActive,
                 subtotal: subtotal.toFixed(2),
                 taxAmount: totalTax.toFixed(2),
                 totalAmount: grandTotal.toFixed(2),
             }).returning();

             if (processedLines.length > 0) {
                 await tx.insert(recurringInvoiceLines).values(
                     processedLines.map(line => ({
                         companyId,
                         templateId: template.id,
                         lineNumber: line.lineNumber,
                         itemId: line.itemId,
                         description: line.description,
                         quantity: line.quantity.toString(),
                         uom: line.uom,
                         unitPrice: line.unitPrice.toString(),
                         discountPercent: (line.discountPercent || 0).toString(),
                         taxAmount: line.taxAmount,
                         lineTotal: line.lineTotal
                     }))
                 );
             }
        });

        revalidatePath("/sales/recurring-invoices");
        return { success: true };

    } catch (error: any) {
        console.error("Create recurring invoice error:", error);
        return { success: false, message: error.message };
    }
}
