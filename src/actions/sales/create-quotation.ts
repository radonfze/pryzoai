"use server";

import { db } from "@/db";
import { 
  salesQuotations, 
  salesLines,
  companies,
  customers,
  items,
  numberSeries,
  currencies
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Response type
export type ActionResponse = {
  success: boolean;
  message: string;
  data?: any;
};

// Input types
type QuotationLine = {
  itemId: string;
  description?: string;
  quantity: number;
  uom: string;
  unitPrice: number;
  discountPercent?: number;
  taxPercent?: number;
};

type QuotationInput = {
  customerId: string;
  quotationDate: string; // YYYY-MM-DD  
  validUntil?: string; // YYYY-MM-DD
  reference?: string;
  currencyId?: string;
  discountPercent?: number;
  notes?: string;
  termsAndConditions?: string;
  lines: QuotationLine[];
};

// Generate quotation number with format: QT-2025-00001
async function generateQuotationNumber(
  companyId: string,
  quotationDate: Date
): Promise<string> {
  // Try to get number series for quotations
  const series = await db.query.numberSeries.findFirst({
    where: and(
      eq(numberSeries.companyId, companyId),
      eq(numberSeries.documentType, "quotation"),
      eq(numberSeries.isActive, true)
    ),
  });

  if (!series) {
    // Fallback: Use timestamp-based number
    return `QT-${Date.now()}`;
  }

  // Extract year from quotation date
  const year = quotationDate.getFullYear();
  let yearPart = "";
  
  if (series.yearFormat === "YYYY") {
    yearPart = year.toString();
  } else if (series.yearFormat === "YY") {
    yearPart = year.toString().slice(-2);
  }
  // If "NONE", yearPart stays empty

  // Increment counter (series.currentValue is the NEXT number to use)
  const nextNumber = series.currentValue;
  
  // Update the series counter
  await db
    .update(numberSeries)
    .set({ 
      currentValue: nextNumber + 1,
      updatedAt: new Date()
    })
    .where(eq(numberSeries.id, series.id));

  // Pad to 5 digits
  const paddedNumber = nextNumber.toString().padStart(5, "0");

  // Build final number: PREFIX-YEAR-NUMBER or PREFIX-NUMBER (if no year)
  const parts = [series.prefix];
  if (yearPart) {
    parts.push(yearPart);
  }
  parts.push(paddedNumber);

  return parts.join(series.separator || "-");
}

// Master data fetching
async function getQuotationMasterData(companyId: string) {
  const [activeCustomers, activeItems, activeCurrency, company] = await Promise.all([
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
    db.query.items.findMany({
      where: and(
        eq(items.companyId, companyId),
        eq(items.isActive, true)
      ),
      columns: {
        id: true,
        name: true,
        code: true,
        sellingPrice: true,
        taxPercent: true,
        uom: true,
      },
    }),
    db.query.currencies.findFirst({
      where: eq(currencies.code, "AED"),
      columns: {
        id: true,
        code: true,
      },
    }),
    db.query.companies.findFirst({
      where: eq(companies.id, companyId),
      columns: {
        id: true,
        legalName: true,
        currency: true,
      },
    }),
  ]);

  return {
    customers: activeCustomers,
    items: activeItems,
    currency: activeCurrency,
    company,
  };
}

export async function createQuotationAction(
  input: QuotationInput
): Promise<ActionResponse> {
  try {
    // 1. Hardcoded company ID for demo
    const DEMO_COMPANY_ID = "00000000-0000-0000-0000-000000000000";

    // 2. Server-side validation
    if (!input.customerId) {
      return { success: false, message: "Customer is required" };
    }

    if (!input.quotationDate) {
      return { success: false, message: "Quotation date is required" };
    }

    if (!input.lines || input.lines.length === 0) {
      return { success: false, message: "At least one line item is required" };
    }

    // 3. Calculate totals server-side
    let subtotal = 0;
    let totalTax = 0;

    const processedLines = input.lines.map((line, index) => {
      const qty = Number(line.quantity);
      const price = Number(line.unitPrice);
      const discPct = Number(line.discountPercent || 0);
      const taxPct = Number(line.taxPercent || 0);

      const lineSubtotal = qty * price;
      const discAmount = (lineSubtotal * discPct) / 100;
      const lineAfterDisc = lineSubtotal - discAmount;
      const lineTax = (lineAfterDisc * taxPct) / 100;
      const lineTotal = lineAfterDisc + lineTax;

      subtotal += lineAfterDisc;
      totalTax += lineTax;

      return {
        ...line,
        lineNumber: index + 1,
        discountAmount: discAmount.toFixed(2),
        taxAmount: lineTax.toFixed(2),
        lineTotal: lineTotal.toFixed(2),
      };
    });

    // Document-level discount
    const docDiscPct = Number(input.discountPercent || 0);
    const docDiscAmount = (subtotal * docDiscPct) / 100;
    const subtotalAfterDisc = subtotal - docDiscAmount;
    const finalTax = totalTax; // Tax already calculated per line
    const grandTotal = subtotalAfterDisc + finalTax;

    // 4. Generate quotation number
    const quotationDate = new Date(input.quotationDate);
    const quotationNumber = await generateQuotationNumber(
      DEMO_COMPANY_ID,
      quotationDate
    );

    // 5. Calculate valid until (default: 30 days from quotation date)
    const validUntil = input.validUntil 
      ? new Date(input.validUntil)
      : new Date(quotationDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    // 6. Get default currency
    const defaultCurrency = await db.query.currencies.findFirst({
      where: eq(currencies.code, "AED"),
    });

    // 7. Transactional insert
    const result = await db.transaction(async (tx) => {
      // Insert quotation header
      const [quotation] = await tx
        .insert(salesQuotations)
        .values({
          companyId: DEMO_COMPANY_ID,
          customerId: input.customerId,
          quotationNumber,
          quotationDate: input.quotationDate,
          validUntil: validUntil.toISOString().split("T")[0],
          reference: input.reference,
          currencyId: input.currencyId || defaultCurrency?.id,
          exchangeRate: "1.0",
          subtotal: subtotal.toFixed(2),
          discountPercent: docDiscPct.toFixed(2),
          discountAmount: docDiscAmount.toFixed(2),
          taxAmount: finalTax.toFixed(2),
          totalAmount: grandTotal.toFixed(2),
          notes: input.notes,
          termsAndConditions: input.termsAndConditions,
          status: "draft", // Default status
        })
        .returning();

      // Insert quotation lines
      await tx.insert(salesLines).values(
        processedLines.map((line) => ({
          companyId: DEMO_COMPANY_ID,
          quotationId: quotation.id,
          lineNumber: line.lineNumber,
          itemId: line.itemId,
          description: line.description || "",
          quantity: line.quantity.toString(),
          uom: line.uom,
          unitPrice: line.unitPrice.toString(),
          discountPercent: (line.discountPercent || 0).toString(),
          discountAmount: line.discountAmount,
          taxAmount: line.taxAmount,
          lineTotal: line.lineTotal,
        }))
      );

      return { quotation };
    });

    // 8. Revalidate paths
    revalidatePath("/sales/quotations");

    return {
      success: true,
      message: `Quotation ${quotationNumber} created successfully`,
      data: { id: result.quotation.id, quotationNumber },
    };
  } catch (error: any) {
    console.error("Create quotation error:", error);
    return {
      success: false,
      message: error.message || "Failed to create quotation",
    };
  }
}

// Export master data fetcher for form
export { getQuotationMasterData };
