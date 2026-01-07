import { db } from "@/db";
import { salesInvoices, approvalRules, approvalRequests } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCompanyId, requirePermission, getUserId } from "@/lib/auth";

export async function submitInvoiceForApproval(invoiceId: string): Promise<{ success: boolean; message: string }> {
  try {
    const companyId = await getCompanyId();
    const userId = await getUserId();
    
    // Check permission to submit (usually creates also submit)
    await requirePermission("sales.invoices.create");

    // 1. Fetch Invoice
    const invoice = await db.query.salesInvoices.findFirst({
        where: eq(salesInvoices.id, invoiceId)
    });

    if (!invoice) return { success: false, message: "Invoice not found" };
    if (invoice.status !== "draft") return { success: false, message: "Only draft invoices can be submitted" };

    // 2. Check for Approval Rules
    const rule = await db.query.approvalRules.findFirst({
        where: and(
            eq(approvalRules.companyId, companyId),
            eq(approvalRules.documentType, "invoice"),
            eq(approvalRules.isActive, true)
        ),
        orderBy: (rules, { asc }) => [asc(rules.priority)]
    });

    // If no rule, auto-approve or keep draft? 
    // Usually systems auto-approve if no rule matches, but for this feature we want to demonstrate approval.
    // If no rule exists, we will transition to 'sent' (Approved effectively) or just 'issued'.
    // Let's assume if no rule, it stays Draft or goes to Sent directly?
    // Let's implement: If no rule, skip approval --> set to 'sent' (or whatever standard flow is).
    
    if (!rule) {
        // Auto-approve / Skip
        await db.update(salesInvoices)
            .set({ status: "sent", updatedAt: new Date() }) // Sent means ready/unpaid
            .where(eq(salesInvoices.id, invoiceId));
        
        revalidatePath("/sales/invoices");
        return { success: true, message: "Invoice approved (No approval rules found)" };
    }

    // 3. Create Approval Request
    await db.transaction(async (tx) => {
        await tx.insert(approvalRequests).values({
            companyId,
            documentType: "invoice",
            documentId: invoiceId,
            documentNumber: invoice.invoiceNumber,
            ruleId: rule.id,
            requestedBy: userId,
            status: "PENDING",
            currentStep: 1,
            requestedAt: new Date()
        });

        // 4. Update Invoice Status
        await tx.update(salesInvoices)
            .set({ status: "pending_approval", updatedAt: new Date() })
            .where(eq(salesInvoices.id, invoiceId));
    });

    revalidatePath("/sales/invoices");
    return { success: true, message: "Invoice submitted for approval" };

  } catch (error: any) {
    console.error("Submit Invoice Error:", error);
    return { success: false, message: "Failed to submit invoice" };
  }
}
