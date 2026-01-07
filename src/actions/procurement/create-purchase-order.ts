"use server";

import { db } from "@/db";
import { getCompanyId } from "@/lib/auth";
import { 
  purchaseOrders,
  purchaseLines,
  companies,
  suppliers,
  items,
  warehouses,
  numberSeries,
  currencies
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ActionResponse = {
  success: boolean;
  message: string;
  data?: any;
};

type POLine = {
  itemId: string;
  description?: string;
  quantity: number;
  uom: string;
  unitPrice: number;
  discountPercent?: number;
  taxPercent?: number;
};

type PurchaseOrderInput = {
  supplierId: string;
  warehouseId?: string;
  orderDate: string;
  deliveryDate?: string;
  reference?: string;
  currencyId?: string;
  discountPercent?: number;
  notes?: string;
  lines: POLine[];
};

async function generatePONumber(companyId: string, orderDate: Date): Promise<string> {
  const series = await db.query.numberSeries.findFirst({
    where: and(
      eq(numberSeries.companyId, companyId),
      eq(numberSeries.documentType, "purchase_order"),
      eq(numberSeries.isActive, true)
    ),
  });

  if (!series) return `PO-${Date.now()}`;

  const year = orderDate.getFullYear();
  let yearPart = "";
  
  if (series.yearFormat === "YYYY") yearPart = year.toString();
  else if (series.yearFormat === "YY") yearPart = year.toString().slice(-2);

  const nextNumber = series.currentValue;
  
  await db.update(numberSeries)
    .set({ currentValue: nextNumber + 1, updatedAt: new Date() })
    .where(eq(numberSeries.id, series.id));

  const paddedNumber = nextNumber.toString().padStart(5, "0");
  const parts = [series.prefix];
  if (yearPart) parts.push(yearPart);
  parts.push(paddedNumber);

  return parts.join(series.separator || "-");
}

async function getPOMasterData(companyId: string) {
  const [activeSuppliers, activeItems, activeWarehouses, activeCurrency] = await Promise.all([
    db.query.suppliers.findMany({
      where: and(eq(suppliers.companyId, companyId), eq(suppliers.isActive, true)),
      columns: { id: true, name: true, code: true },
    }),
    db.query.items.findMany({
      where: and(eq(items.companyId, companyId), eq(items.isActive, true)),
      columns: { id: true, name: true, code: true, costPrice: true, uom: true },
    }),
    db.query.warehouses.findMany({
      where: and(eq(warehouses.companyId, companyId), eq(warehouses.isActive, true)),
      columns: { id: true, name: true, code: true },
    }),
    db.query.currencies.findFirst({
      where: eq(currencies.code, "AED"),
      columns: { id: true, code: true },
    }),
  ]);

  return { suppliers: activeSuppliers, items: activeItems, warehouses: activeWarehouses, currency: activeCurrency };
}

export async function createPurchaseOrderAction(input: PurchaseOrderInput): Promise<ActionResponse> {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return { success: false, message: "Unauthorized: No active company" };

    if (!input.supplierId) return { success: false, message: "Supplier is required" };
    if (!input.orderDate) return { success: false, message: "Order date is required" };
    if (!input.lines || input.lines.length === 0) return { success: false, message: "At least one line item is required" };

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

    const docDiscPct = Number(input.discountPercent || 0);
    const docDiscAmount = (subtotal * docDiscPct) / 100;
    const subtotalAfterDisc = subtotal - docDiscAmount;
    const finalTax = totalTax;
    const grandTotal = subtotalAfterDisc + finalTax;

    const orderDate = new Date(input.orderDate);
    const orderNumber = await generatePONumber(companyId, orderDate);

    const deliveryDate = input.deliveryDate 
      ? new Date(input.deliveryDate)
      : new Date(orderDate.getTime() + 14 * 24 * 60 * 60 * 1000);

    const defaultCurrency = await db.query.currencies.findFirst({
      where: eq(currencies.code, "AED"),
    });

    const result = await db.transaction(async (tx) => {
      const [po] = await tx.insert(purchaseOrders).values({
        companyId: companyId,
        supplierId: input.supplierId,
        warehouseId: input.warehouseId,
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
        receivedQty: "0",
        invoicedQty: "0",
        notes: input.notes,
        status: "draft",
      }).returning();

      await tx.insert(purchaseLines).values(
        processedLines.map((line) => ({
          companyId: companyId,
          purchaseOrderId: po.id,
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
          receivedQty: "0",
          invoicedQty: "0",
        }))
      );

      return { po };
    });

    revalidatePath("/procurement/orders");

    return {
      success: true,
      message: `Purchase Order ${orderNumber} created successfully`,
      data: { id: result.po.id, orderNumber },
    };
  } catch (error: any) {
    console.error("Create PO error:", error);
    return { success: false, message: error.message || "Failed to create purchase order" };
  }
}

export { getPOMasterData };
