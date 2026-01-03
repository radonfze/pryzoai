"use server";

import { db } from "@/db";
import { customers, salesInvoices, salesOrders } from "@/db/schema";
import { eq, and, gt, notInArray } from "drizzle-orm";

export type CreditCheckResult = {
  allowed: boolean;
  customerId: string;
  customerName: string;
  creditLimit: number;
  currentOutstanding: number;
  proposedAmount: number;
  totalAfterTransaction: number;
  availableCredit: number;
  message: string;
};

/**
 * Check if a transaction would exceed the customer's credit limit
 * Returns whether the transaction is allowed and details about the credit status
 */
export async function checkCustomerCreditLimit(
  customerId: string,
  companyId: string,
  proposedAmount: number
): Promise<CreditCheckResult> {
  try {
    // 1. Get customer with credit limit
    const customer = await db.query.customers.findFirst({
      where: and(
        eq(customers.id, customerId),
        eq(customers.companyId, companyId)
      ),
    });

    if (!customer) {
      return {
        allowed: false,
        customerId,
        customerName: "Unknown",
        creditLimit: 0,
        currentOutstanding: 0,
        proposedAmount,
        totalAfterTransaction: proposedAmount,
        availableCredit: 0,
        message: "Customer not found",
      };
    }

    const creditLimit = Number(customer.creditLimit || 0);
    
    // If no credit limit set, allow the transaction
    if (creditLimit <= 0) {
      return {
        allowed: true,
        customerId,
        customerName: customer.name,
        creditLimit: 0,
        currentOutstanding: 0,
        proposedAmount,
        totalAfterTransaction: proposedAmount,
        availableCredit: Infinity,
        message: "No credit limit configured - transaction allowed",
      };
    }

    // 2. Calculate current outstanding (unpaid invoices)
    const unpaidInvoices = await db.query.salesInvoices.findMany({
      where: and(
        eq(salesInvoices.companyId, companyId),
        eq(salesInvoices.customerId, customerId),
        gt(salesInvoices.balanceAmount, "0")
      ),
    });

    const currentOutstanding = unpaidInvoices.reduce(
      (sum, inv) => sum + Number(inv.balanceAmount || 0),
      0
    );

    // 3. Calculate pending orders (not yet invoiced)
    const pendingOrders = await db.query.salesOrders.findMany({
      where: and(
        eq(salesOrders.companyId, companyId),
        eq(salesOrders.customerId, customerId),
        notInArray(salesOrders.status, ["completed", "cancelled"])
      ),
    });

    const pendingOrdersTotal = pendingOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount || 0),
      0
    );

    // 4. Total exposure = outstanding + pending + proposed
    const totalExposure = currentOutstanding + pendingOrdersTotal;
    const totalAfterTransaction = totalExposure + proposedAmount;
    const availableCredit = creditLimit - totalExposure;

    // 5. Check if allowed
    const allowed = totalAfterTransaction <= creditLimit;

    return {
      allowed,
      customerId,
      customerName: customer.name,
      creditLimit,
      currentOutstanding: totalExposure,
      proposedAmount,
      totalAfterTransaction,
      availableCredit: Math.max(0, availableCredit),
      message: allowed
        ? `Credit check passed. Available: ${availableCredit.toFixed(2)} AED`
        : `Credit limit exceeded. Limit: ${creditLimit.toFixed(2)}, Outstanding: ${totalExposure.toFixed(2)}, Available: ${availableCredit.toFixed(2)} AED`,
    };
  } catch (error: any) {
    console.error("Credit check error:", error);
    return {
      allowed: false,
      customerId,
      customerName: "Error",
      creditLimit: 0,
      currentOutstanding: 0,
      proposedAmount,
      totalAfterTransaction: proposedAmount,
      availableCredit: 0,
      message: `Credit check failed: ${error.message}`,
    };
  }
}

/**
 * Get customer credit summary for display
 */
export async function getCustomerCreditSummary(
  customerId: string,
  companyId: string
): Promise<{
  creditLimit: number;
  outstanding: number;
  available: number;
  utilizationPercent: number;
}> {
  const result = await checkCustomerCreditLimit(customerId, companyId, 0);
  
  const utilizationPercent = result.creditLimit > 0
    ? (result.currentOutstanding / result.creditLimit) * 100
    : 0;

  return {
    creditLimit: result.creditLimit,
    outstanding: result.currentOutstanding,
    available: result.availableCredit,
    utilizationPercent: Math.min(100, utilizationPercent),
  };
}
