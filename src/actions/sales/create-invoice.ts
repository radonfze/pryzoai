"use server";

// Force rebuild - 2025-12-27 17:36
import { db } from "@/db";
import { 
  salesInvoices, 
  salesLines, 
  customers, 
  items, 
  warehouses, 
  numberSeries
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Types for the form
export interface InvoiceItemInput {
  itemId: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxRate: number; // e.g. 5.00
  taxAmount: number;
  totalAmount: number;
}

export interface InvoiceFormState {
  customerId: string;
  warehouseId: string;
  invoiceDate: string; // ISO Date
  dueDate: string; // ISO Date
  notes?: string;
  items: InvoiceItemInput[];
}

export async function createInvoiceAction(data: InvoiceFormState, companyId: string) {
  // 0. Validation (Zod here ideally)
  if (!data.customerId || !data.items.length) {
    throw new Error("Missing required fields");
  }

  // 1. Generate Invoice Number (Simplified - use entityType, isActive, currentValue)
  const series = await db.query.numberSeries.findFirst({
      where: and(
        eq(numberSeries.entityType, "invoice"),
        eq(numberSeries.isActive, true)
      )
  });
  const nextNum = (series?.currentValue || 1000) + 1;
  const invoiceNumber = `INV-${nextNum}`;
  
  // NOTE: In production, use the robust locking numbering-service.ts we built!
  // await generateNextNumber("sales_invoice", companyId);

  // 2. Calculate Totals
  const subTotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const totalDiscount = data.items.reduce((sum, item) => sum + item.discountAmount, 0);
  const totalTax = data.items.reduce((sum, item) => sum + item.taxAmount, 0);
  const totalAmount = subTotal - totalDiscount + totalTax;

  // 3. Insert Invoice Header
  // Note: companyId is passed as parameter

  const [newInvoice] = await db.insert(salesInvoices).values({
    companyId,
    invoiceNumber,
    customerId: data.customerId,
    invoiceDate: data.invoiceDate,
    dueDate: data.dueDate,
    subtotal: String(subTotal),
    discountAmount: String(totalDiscount),
    taxAmount: String(totalTax),
    totalAmount: String(totalAmount),
    balanceAmount: String(totalAmount), // Initially full amount pending
    status: "draft", // Start as draft
    notes: data.notes,
  }).returning();

  // 4. Insert Items
  if (data.items.length > 0) {
    await db.insert(salesLines).values(
      data.items.map((item, index) => ({
        companyId,
        invoiceId: newInvoice.id,
        lineNumber: index + 1,
        itemId: item.itemId,
        description: item.description,
        quantity: String(item.quantity),
        uom: "PCS", // Default or fetch from item
        unitPrice: String(item.unitPrice),
        discountAmount: String(item.discountAmount),
        taxAmount: String(item.taxAmount),
        lineTotal: String(item.totalAmount),
      }))
    );
  }

  // 5. Update Number Series (Simplified)
  if (series) {
      await db.update(numberSeries)
        .set({ currentValue: nextNum })
        .where(eq(numberSeries.id, series.id));
  }

  revalidatePath("/sales/invoices");
  redirect("/sales/invoices");
}

// Master Data Fetchers for the Form
export async function getInvoiceMasterData() {
  const [allCustomers, allItems, allWarehouses] = await Promise.all([
    db.query.customers.findMany({ where: eq(customers.isActive, true) }),
    db.query.items.findMany({ where: eq(items.isActive, true) }),
    db.query.warehouses.findMany({ where: eq(warehouses.isActive, true) })
  ]);
  
  return {
    customers: allCustomers,
    items: allItems,
    warehouses: allWarehouses
  };
}
