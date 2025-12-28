"use server";

import { db } from "@/db";
import { 
  customerPayments,
  paymentAllocations,
  salesInvoices,
  companies,
  customers,
  currencies,
  numberSeries
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Response type
export type ActionResponse = {
  success: boolean;
  message: string;
  data?: any;
};

// Input types
type PaymentAllocationInput = {
  invoiceId: string;
  allocatedAmount: number;
};

type PaymentInput = {
  customerId: string;
  paymentDate: string; // YYYY-MM-DD
  paymentMethod: "cash" | "bank" | "cheque" | "card";
  amount: number;
  currencyId?: string;
  reference?: string;
  notes?: string;
  // Bank/Cheque details (optional)
  bankName?: string;
  chequeNumber?: string;
  chequeDate?: string;
  // Allocations to invoices
  allocations?: PaymentAllocationInput[];
};

// Generate payment number with format: PAY-2025-00001
async function generatePaymentNumber(
  companyId: string,
  paymentDate: Date
): Promise<string> {
  const series = await db.query.numberSeries.findFirst({
    where: and(
      eq(numberSeries.companyId, companyId),
      eq(numberSeries.documentType, "payment"),
      eq(numberSeries.isActive, true)
    ),
  });

  if (!series) {
    return `PAY-${Date.now()}`;
  }

  const year = paymentDate.getFullYear();
  let yearPart = "";
  
  if (series.yearFormat === "YYYY") {
    yearPart = year.toString();
  } else if (series.yearFormat === "YY") {
    yearPart = year.toString().slice(-2);
  }

  const nextNumber = series.currentValue;
  
  await db
    .update(numberSeries)
    .set({ 
      currentValue: nextNumber + 1,
      updatedAt: new Date()
    })
    .where(eq(numberSeries.id, series.id));

  const paddedNumber = nextNumber.toString().padStart(5, "0");

  const parts = [series.prefix];
  if (yearPart) {
    parts.push(yearPart);
  }
  parts.push(paddedNumber);

  return parts.join(series.separator || "-");
}

// Master data fetching for payment form
async function getPaymentMasterData(companyId: string) {
  const [activeCustomers, activeCurrency] = await Promise.all([
    db.query.customers.findMany({
      where: and(
        eq(customers.companyId, companyId),
        eq(customers.isActive, true)
      ),
      columns: {
        id: true,
        name: true,
        code: true,
      },
    }),
    db.query.currencies.findFirst({
      where: eq(currencies.code, "AED"),
      columns: {
        id: true,
        code: true,
      },
    }),
  ]);

  return {
    customers: activeCustomers,
    currency: activeCurrency,
  };
}

// Get customer's outstanding invoices
export async function getCustomerOutstandingInvoices(customerId: string) {
  const invoices = await db.query.salesInvoices.findMany({
    where: and(
      eq(salesInvoices.customerId, customerId),
      sql`${salesInvoices.balanceAmount} > 0`
    ),
    columns: {
      id: true,
      invoiceNumber: true,
      invoiceDate: true,
      totalAmount: true,
      paidAmount: true,
      balanceAmount: true,
    },
    orderBy: [salesInvoices.invoiceDate],
  });

  return invoices;
}

export async function createPaymentAction(
  input: PaymentInput
): Promise<ActionResponse> {
  try {
    const DEMO_COMPANY_ID = "00000000-0000-0000-0000-000000000000";

    // Validation
    if (!input.customerId) {
      return { success: false, message: "Customer is required" };
    }

    if (!input.paymentDate) {
      return { success: false, message: "Payment date is required" };
    }

    if (!input.amount || Number(input.amount) <= 0) {
      return { success: false, message: "Payment amount must be greater than zero" };
    }

    if (!input.paymentMethod) {
      return { success: false, message: "Payment method is required" };
    }

    // Calculate total allocated amount
    let totalAllocated = 0;
    if (input.allocations && input.allocations.length > 0) {
      totalAllocated = input.allocations.reduce(
        (sum, alloc) => sum + Number(alloc.allocatedAmount),
        0
      );

      // Validate that allocated amount doesn't exceed payment amount
      if (totalAllocated > Number(input.amount)) {
        return {
          success: false,
          message: "Allocated amount cannot exceed payment amount",
        };
      }
    }

    const unallocatedAmount = Number(input.amount) - totalAllocated;

    // Generate payment number
    const paymentDate = new Date(input.paymentDate);
    const paymentNumber = await generatePaymentNumber(
      DEMO_COMPANY_ID,
      paymentDate
    );

    // Get default currency
    const defaultCurrency = await db.query.currencies.findFirst({
      where: eq(currencies.code, "AED"),
    });

    // Transactional insert
    const result = await db.transaction(async (tx) => {
      // Insert payment header
      const [payment] = await tx
        .insert(customerPayments)
        .values({
          companyId: DEMO_COMPANY_ID,
          customerId: input.customerId,
          paymentNumber,
          paymentDate: input.paymentDate,
          paymentMethod: input.paymentMethod,
          amount: input.amount.toString(),
          currencyId: input.currencyId || defaultCurrency?.id,
          exchangeRate: "1.0",
          allocatedAmount: totalAllocated.toString(),
          unallocatedAmount: unallocatedAmount.toString(),
          reference: input.reference,
          notes: input.notes,
          bankName: input.bankName,
          chequeNumber: input.chequeNumber,
          chequeDate: input.chequeDate,
          status: "draft",
          isPosted: false,
        })
        .returning();

      // Insert payment allocations and update invoice balances
      if (input.allocations && input.allocations.length > 0) {
        for (const allocation of input.allocations) {
          // Insert allocation record
          await tx.insert(paymentAllocations).values({
            companyId: DEMO_COMPANY_ID,
            paymentId: payment.id,
            invoiceId: allocation.invoiceId,
            allocatedAmount: allocation.allocatedAmount.toString(),
            allocationDate: input.paymentDate,
          });

          // Update invoice paid and balance amounts
          const invoice = await tx.query.salesInvoices.findFirst({
            where: eq(salesInvoices.id, allocation.invoiceId),
            columns: {
              paidAmount: true,
              balanceAmount: true,
              totalAmount: true,
            },
          });

          if (invoice) {
            const newPaidAmount = Number(invoice.paidAmount || 0) + Number(allocation.allocatedAmount);
            const newBalanceAmount = Number(invoice.totalAmount) - newPaidAmount;

            await tx
              .update(salesInvoices)
              .set({
                paidAmount: newPaidAmount.toFixed(2),
                balanceAmount: newBalanceAmount.toFixed(2),
                status: newBalanceAmount <= 0 ? "completed" : newBalanceAmount < Number(invoice.totalAmount) ? "partial" : "sent",
                updatedAt: new Date(),
              })
              .where(eq(salesInvoices.id, allocation.invoiceId));
          }
        }
      }

      return { payment };
    });

    revalidatePath("/sales/payments");
    revalidatePath("/sales/invoices");

    return {
      success: true,
      message: `Payment ${paymentNumber} recorded successfully`,
      data: { id: result.payment.id, paymentNumber },
    };
  } catch (error: any) {
    console.error("Create payment error:", error);
    return {
      success: false,
      message: error.message || "Failed to record payment",
    };
  }
}

// Export master data fetcher
export { getPaymentMasterData };
