"use server";

import { db } from "@/db";
import { 
  customerPayments, 
  paymentAllocations, 
  salesInvoices 
} from "@/db/schema";
import { eq, and, asc, gt } from "drizzle-orm";

export type AllocationResult = {
  invoiceId: string;
  invoiceNumber: string;
  allocatedAmount: number;
  remainingBalance: number;
};

/**
 * Automatically allocate a payment to unpaid invoices using FIFO
 * (First In, First Out - oldest invoices first)
 */
export async function allocatePaymentFIFO(
  paymentId: string,
  customerId: string,
  companyId: string,
  amountToAllocate: number
): Promise<{ success: boolean; message: string; allocations: AllocationResult[] }> {
  try {
    if (amountToAllocate <= 0) {
      return { success: false, message: "Amount must be positive", allocations: [] };
    }

    const allocations: AllocationResult[] = [];
    let remaining = amountToAllocate;

    await db.transaction(async (tx) => {
      // 1. Get unpaid invoices for this customer, ordered by date (FIFO)
      const unpaidInvoices = await tx.query.salesInvoices.findMany({
        where: and(
          eq(salesInvoices.companyId, companyId),
          eq(salesInvoices.customerId, customerId),
          gt(salesInvoices.balanceAmount, "0")
        ),
        orderBy: [asc(salesInvoices.invoiceDate)], // FIFO: oldest first
      });

      if (unpaidInvoices.length === 0) {
        return; // No invoices to allocate
      }

      // 2. Allocate to each invoice until payment exhausted
      for (const invoice of unpaidInvoices) {
        if (remaining <= 0) break;

        const invoiceBalance = Number(invoice.balanceAmount || 0);
        const allocationAmount = Math.min(remaining, invoiceBalance);

        if (allocationAmount <= 0) continue;

        // Create allocation record
        await tx.insert(paymentAllocations).values({
          companyId: companyId,
          paymentId: paymentId,
          invoiceId: invoice.id,
          allocatedAmount: allocationAmount.toString(),
          allocationDate: new Date().toISOString().split("T")[0],
        });

        // Update invoice paid/balance amounts
        const newPaid = Number(invoice.paidAmount || 0) + allocationAmount;
        const newBalance = Number(invoice.totalAmount || 0) - newPaid;
        const newStatus = newBalance <= 0 ? "completed" : "partial";

        await tx
          .update(salesInvoices)
          .set({
            paidAmount: newPaid.toString(),
            balanceAmount: Math.max(0, newBalance).toString(),
            status: newStatus,
            lastPaymentDate: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(salesInvoices.id, invoice.id));

        allocations.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          allocatedAmount: allocationAmount,
          remainingBalance: Math.max(0, newBalance),
        });

        remaining -= allocationAmount;
      }

      // 3. Update payment allocated/unallocated amounts
      const totalAllocated = amountToAllocate - remaining;
      await tx
        .update(customerPayments)
        .set({
          allocatedAmount: totalAllocated.toString(),
          unallocatedAmount: remaining.toString(),
          updatedAt: new Date(),
        })
        .where(eq(customerPayments.id, paymentId));
    });

    return {
      success: true,
      message: `Allocated ${amountToAllocate - remaining} to ${allocations.length} invoice(s)`,
      allocations,
    };
  } catch (error: any) {
    console.error("Payment allocation error:", error);
    return { success: false, message: error.message, allocations: [] };
  }
}

/**
 * Get customer outstanding balance (sum of unpaid invoice balances)
 */
export async function getCustomerOutstandingBalance(
  customerId: string,
  companyId: string
): Promise<number> {
  const invoices = await db.query.salesInvoices.findMany({
    where: and(
      eq(salesInvoices.companyId, companyId),
      eq(salesInvoices.customerId, customerId),
      gt(salesInvoices.balanceAmount, "0")
    ),
  });

  return invoices.reduce((sum, inv) => sum + Number(inv.balanceAmount || 0), 0);
}
