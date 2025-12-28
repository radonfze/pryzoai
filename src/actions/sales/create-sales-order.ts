"use server";

import { db } from "@/db";
import { 
  salesOrders, 
  salesLines,
  companies,
  customers,
  items,
  warehouses,
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
type OrderLine = {
  itemId: string;
  description?: string;
  quantity: number;
  uom: string;
  unitPrice: number;
  discountPercent?: number;
  taxPercent?: number;
};

type SalesOrderInput = {
  customerId: string;
  warehouseId?: string;
  quotationId?: string; // Optional link to quotation
  orderDate: string; // YYYY-MM-DD  
  deliveryDate?: string; // YYYY-MM-DD
  reference?: string;
  currencyId?: string;
  discountPercent?: number;
  notes?: string;
  lines: OrderLine[];
};

// Generate sales order number with format: SO-2025-00001
async function generateSalesOrderNumber(
  companyId: string,
  orderDate: Date
): Promise<string> {
  const series = await db.query.numberSeries.findFirst({
    where: and(
      eq(numberSeries.companyId, companyId),
      eq(numberSeries.documentType, "sales_order"),
      eq(numberSeries.isActive, true)
    ),
  });

  if (!series) {
    return `SO-${Date.now()}`;
  }

  const year = orderDate.getFullYear();
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

// Master data fetching for SO form
async function getSalesOrderMasterData(companyId: string) {
  const [activeCustomers, activeItems, activeWarehouses, activeCurrency] = await Promise.all([
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
    db.query.warehouses.findMany({
      where: and(
        eq(warehouses.companyId, companyId),
        eq(warehouses.isActive, true)
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
    items: activeItems,
    warehouses: activeWarehouses,
    currency: activeCurrency,
  };
}

export async function createSalesOrderAction(
  input: SalesOrderInput
): Promise<ActionResponse> {
  try {
    const DEMO_COMPANY_ID = "00000000-0000-0000-0000-000000000000";

    // Validation
    if (!input.customerId) {
      return { success: false, message: "Customer is required" };
    }

    if (!input.orderDate) {
      return { success: false, message: "Order date is required" };
    }

    if (!input.lines || input.lines.length === 0) {
      return { success: false, message: "At least one line item is required" };
    }

    // Calculate totals server-side
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
    const finalTax = totalTax;
    const grandTotal = subtotalAfterDisc + finalTax;

    // Generate order number
    const orderDate = new Date(input.orderDate);
    const orderNumber = await generateSalesOrderNumber(
      DEMO_COMPANY_ID,
      orderDate
    );

    // Calculate delivery date (default: 7 days from order date if not provided)
    const deliveryDate = input.deliveryDate 
      ? new Date(input.deliveryDate)
      : new Date(orderDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Get default currency
    const defaultCurrency = await db.query.currencies.findFirst({
      where: eq(currencies.code, "AED"),
    });

    // Transactional insert
    const result = await db.transaction(async (tx) => {
      // Insert sales order header
      const [order] = await tx
        .insert(salesOrders)
        .values({
          companyId: DEMO_COMPANY_ID,
          customerId: input.customerId,
          warehouseId: input.warehouseId,
          quotationId: input.quotationId, // Link to quotation if provided
          orderNumber,
          orderDate: input.orderDate,
          deliveryDate: deliveryDate.toISOString().split("T")[0],
          reference: input.reference,
          currencyId: input.currencyId || defaultCurrency?.id,
          exchangeRate: "1.0",
          subtotal: subtotal.toFixed(2),
          discountPercent: docDiscPct.toFixed(2),
          discountAmount: docDiscAmount.toFixed(2),
          taxAmount: finalTax.toFixed(2),
          totalAmount: grandTotal.toFixed(2),
          deliveredQty: "0", // Not yet delivered
          invoicedQty: "0", // Not yet invoiced
          notes: input.notes,
          status: "draft",
        })
        .returning();

      // Insert order lines
      await tx.insert(salesLines).values(
        processedLines.map((line) => ({
          companyId: DEMO_COMPANY_ID,
          salesOrderId: order.id,
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
          deliveredQty: "0",
          invoicedQty: "0",
        }))
      );

      return { order };
    });

    revalidatePath("/sales/orders");

    return {
      success: true,
      message: `Sales Order ${orderNumber} created successfully`,
      data: { id: result.order.id, orderNumber },
    };
  } catch (error: any) {
    console.error("Create sales order error:", error);
    return {
      success: false,
      message: error.message || "Failed to create sales order",
    };
  }
}

// Export master data fetcher
export { getSalesOrderMasterData };
