"use server";

import { db } from "@/db";
import { customers, salesInvoices } from "@/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export interface CreditValidationResult {
  allowed: boolean;
  creditLimit: number;
  outstandingBalance: number;
  availableCredit: number;
  estimatedTotal: number;
  message: string;
}

/**
 * Validate if a customer has sufficient credit for a new invoice
 * @param customerId - Customer UUID
 * @param estimatedTotal - Total amount of the new invoice
 * @returns Validation result with available credit info
 */
export async function validateCustomerCredit(
  customerId: string,
  estimatedTotal: number
): Promise<CreditValidationResult> {
  const session = await getSession();
  if (!session?.companyId) {
    return {
      allowed: false,
      creditLimit: 0,
      outstandingBalance: 0,
      availableCredit: 0,
      estimatedTotal,
      message: "No active session",
    };
  }

  // Get customer with their credit settings
  const customer = await db.query.customers.findFirst({
    where: and(
      eq(customers.id, customerId),
      eq(customers.companyId, session.companyId)
    ),
    columns: {
      id: true,
      name: true,
      creditLimit: true,
      outstandingBalance: true,
    },
  });

  if (!customer) {
    return {
      allowed: false,
      creditLimit: 0,
      outstandingBalance: 0,
      availableCredit: 0,
      estimatedTotal,
      message: "Customer not found",
    };
  }

  const creditLimit = Number(customer.creditLimit) || 0;
  const outstandingBalance = Number(customer.outstandingBalance) || 0;
  
  // No credit limit set = unlimited credit
  if (creditLimit === 0) {
    return {
      allowed: true,
      creditLimit: 0,
      outstandingBalance,
      availableCredit: Infinity,
      estimatedTotal,
      message: "No credit limit configured (unlimited)",
    };
  }

  const availableCredit = creditLimit - outstandingBalance;
  const allowed = estimatedTotal <= availableCredit;

  return {
    allowed,
    creditLimit,
    outstandingBalance,
    availableCredit,
    estimatedTotal,
    message: allowed
      ? `Credit available: ${availableCredit.toFixed(2)} AED`
      : `Credit limit exceeded. Available: ${availableCredit.toFixed(2)} AED, Required: ${estimatedTotal.toFixed(2)} AED`,
  };
}

/**
 * Recalculate and update a customer's outstanding balance from posted invoices
 * Should be called after invoice status changes or payments
 */
export async function updateCustomerOutstandingBalance(
  customerId: string
): Promise<void> {
  const session = await getSession();
  if (!session?.companyId) return;

  // Calculate sum of balance_amount from all posted, unpaid/partial invoices
  const result = await db
    .select({
      totalOutstanding: sql<string>`COALESCE(SUM(${salesInvoices.balanceAmount}::numeric), 0)`,
    })
    .from(salesInvoices)
    .where(
      and(
        eq(salesInvoices.customerId, customerId),
        eq(salesInvoices.companyId, session.companyId),
        eq(salesInvoices.isPosted, true),
        inArray(salesInvoices.status, ["issued", "partial"])
      )
    );

  const totalOutstanding = Number(result[0]?.totalOutstanding) || 0;

  // Update customer record
  await db
    .update(customers)
    .set({
      outstandingBalance: totalOutstanding.toFixed(2),
      updatedAt: new Date(),
    })
    .where(eq(customers.id, customerId));
}

/**
 * Batch update outstanding balances for multiple customers
 * Useful for periodic reconciliation jobs
 */
export async function recalculateAllCustomerBalances(): Promise<number> {
  const session = await getSession();
  if (!session?.companyId) return 0;

  // Get all customers for this company
  const allCustomers = await db.query.customers.findMany({
    where: eq(customers.companyId, session.companyId),
    columns: { id: true },
  });

  let updatedCount = 0;
  for (const customer of allCustomers) {
    await updateCustomerOutstandingBalance(customer.id);
    updatedCount++;
  }

  return updatedCount;
}
