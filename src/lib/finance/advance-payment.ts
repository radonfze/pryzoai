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
  if (payment.status !== "posted") throw new Error("Payment must be posted first");

  // 2. Identify COA Accounts
  // In a real system, fetch these from default_settings
  const BANK_OR_CASH_ACCOUNT = "110100"; // Cash/Bank Asset
  const ADVANCE_LIABILITY_ACCOUNT = "210200"; // Advance from Customer Liability

  // 3. Post Journal Entry
  // Debit: Bank/Cash (Asset Increase)
  // Credit: Advance from Customer (Liability Increase)
  await createPosting({
    companyId,
    transactionDate: new Date(payment.paymentDate), // valid Date object or string
    documentType: "RCT",
    documentId: payment.id,
    documentNumber: payment.paymentNumber,
    description: `Advance Receipt: ${payment.paymentNumber}`,
    currencyId: payment.currencyId || undefined,
    exchangeRate: payment.exchangeRate ? Number(payment.exchangeRate) : 1,
    lines: [
      {
        accountId: BANK_OR_CASH_ACCOUNT,
        debit: Number(payment.amount),
        credit: 0,
        description: `Receipt into Bank`,
      },
      {
        accountId: ADVANCE_LIABILITY_ACCOUNT,
        debit: 0,
        credit: Number(payment.amount),
        description: `Advance Liability`,
      },
    ],
    postedBy: userId,
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
    documentType: "ALL",
    documentId: allocation.id,
    documentNumber: `${allocation.payment.paymentNumber}-ALLOC`,
    description: `Allocation of Advance ${allocation.payment.paymentNumber} to Invoice ${allocation.invoice.invoiceNumber}`,
    lines: [
      {
        accountId: ADVANCE_LIABILITY_ACCOUNT,
        debit: amount,
        credit: 0,
        description: `Reduce Advance Liability`,
      },
      {
        accountId: AR_ACCOUNT,
        debit: 0,
        credit: amount,
        description: `Settle AR`,
      },
    ],
    postedBy: userId,
  });
}
