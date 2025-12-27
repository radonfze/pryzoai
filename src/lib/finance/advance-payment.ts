import { db } from "@/db";
import { customerPayments, paymentAllocations, salesInvoices } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createPosting } from "./coa-posting";

/**
 * Advance Payment Engine
 * Handles accounting for payments received before invoicing.
 */

export async function postAdvanceReceipt(paymentId: string, companyId: string, userId: string) {
  // 1. Fetch Payment
  const payment = await db.query.customerPayments.findFirst({
    where: eq(customerPayments.id, paymentId),
  });

  if (!payment) throw new Error("Payment not found");
  // customerPayments uses salesStatusEnum: draft, sent, confirmed, partial, completed, cancelled
  // Use "confirmed" as posted equivalent
  if (payment.status !== "confirmed") throw new Error("Payment must be confirmed first");

  // 2. Identify COA Accounts (account codes, not IDs)
  const BANK_OR_CASH_ACCOUNT = "110100"; // Cash/Bank Asset
  const ADVANCE_LIABILITY_ACCOUNT = "210200"; // Advance from Customer Liability

  // 3. Post Journal Entry
  // Debit: Bank/Cash (Asset Increase)
  // Credit: Advance from Customer (Liability Increase)
  await createPosting({
    companyId,
    transactionDate: new Date(payment.paymentDate),
    documentType: "sales_payment",
    documentId: payment.id,
    documentNumber: payment.paymentNumber,
    lines: [
      {
        accountCode: BANK_OR_CASH_ACCOUNT,
        debit: Number(payment.amount),
        credit: 0,
        description: `Receipt into Bank`,
      },
      {
        accountCode: ADVANCE_LIABILITY_ACCOUNT,
        debit: 0,
        credit: Number(payment.amount),
        description: `Advance Liability`,
      },
    ],
    userId,
  });
}

/**
 * Allocate Advance to Invoice
 * Reclassifies liability to settle AR.
 */
export async function allocateAdvance(allocationId: string, companyId: string, userId: string) {
  // 1. Fetch Allocation
  const allocation = await db.query.paymentAllocations.findFirst({
    where: eq(paymentAllocations.id, allocationId),
    with: {
      payment: true,
      invoice: true
    }
  });

  if (!allocation) throw new Error("Allocation not found");

  const amount = Number(allocation.allocatedAmount);
  const ADVANCE_LIABILITY_ACCOUNT = "210200"; // Decrease Liability
  const AR_ACCOUNT = "110300"; // Accounts Receivable (Asset Decrease)

  // 2. Post Journal Entry
  // Debit: Advance Liability (Liability Decrease)
  // Credit: Accounts Receivable (Asset Decrease - Customer paid)
  await createPosting({
    companyId,
    transactionDate: new Date(allocation.allocationDate),
    documentType: "sales_payment",
    documentId: allocation.id,
    documentNumber: `${allocation.payment.paymentNumber}-ALLOC`,
    lines: [
      {
        accountCode: ADVANCE_LIABILITY_ACCOUNT,
        debit: amount,
        credit: 0,
        description: `Reduce Advance Liability`,
      },
      {
        accountCode: AR_ACCOUNT,
        debit: 0,
        credit: amount,
        description: `Settle AR`,
      },
    ],
    userId,
  });
}
