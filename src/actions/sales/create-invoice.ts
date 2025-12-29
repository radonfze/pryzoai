"use server";

import { db } from "@/db";
import { 
  salesInvoices, 
  salesLines, 
  customers, 
  items, 
  warehouses, 
  numberSeries,
  companies,
  defaultGlAccounts
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateNextNumber } from "@/lib/services/number-generator";
import { postSalesInvoiceToGL } from "@/lib/services/gl-posting-service";


// --- Types ---

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
  invoiceDate: string; // ISO Date String
  dueDate: string;     // ISO Date String
  notes?: string;
  items: InvoiceItemInput[];
}

export interface ActionResponse {
  success: boolean;
  message: string;
  invoiceId?: string;
}

// --- Action ---

export async function createInvoiceAction(data: InvoiceFormState): Promise<ActionResponse> {
  try {
    // 0. Preliminary Validation
    if (!data.customerId || !data.items.length) {
      return { success: false, message: "Customer and at least one item are required." };
    }

    // 1. Transaction Wrapper
    return await db.transaction(async (tx) => {
      // 1a. Fetch Context
      const company = await tx.query.companies.findFirst({
         where: eq(companies.active, true),
         with: { baseCurrency: true }
      });

      if (!company) {
          throw new Error("System Error: No active company found for context.");
      }

      const companyId = company.id;
      
      // 1b. Generate Invoice Number (Gapless Service)
      const numResult = await generateNextNumber({
        companyId,
        entityType: "invoice",
        documentType: "INV", // Optional sub-type
        created_by: "system" // Todo: get user ID
      });

      if (!numResult.success || !numResult.number) {
        // Fallback or Error
        // If service fails (e.g. no series), we *could* fallback, but for Phase 4 strictness we should error or auto-seed.
        // For now, let's create dynamic fallback to prevent blockers if series missing
        console.warn("Number Series Error:", numResult.error);
        if (numResult.error?.includes("No active number series")) {
            throw new Error("Missing Number Series for Invoices. Please configure in Settings.");
        }
        throw new Error(numResult.error || "Failed to generate invoice number");
      }
      
      const invoiceNumber = numResult.number;

      // 2. Calculate Totals
      let subTotal = 0;
      let totalDiscount = 0;
      let totalTax = 0;

      const lineItems = data.items.map(item => {
         const lineSub = item.quantity * item.unitPrice;
         const lineTaxable = Math.max(0, lineSub - item.discountAmount);
         const lineTax = lineTaxable * (item.taxRate / 100);
         const lineTotal = lineTaxable + lineTax;

         subTotal += lineSub;
         totalDiscount += item.discountAmount;
         totalTax += lineTax;

         return {
            ...item,
            lineSub,
            lineTax,
            lineTotal
         };
      });

      const grandTotal = subTotal - totalDiscount + totalTax;

      // 3. Insert Invoice Header
      const [newInvoice] = await tx.insert(salesInvoices).values({
        companyId,
        invoiceNumber,
        customerId: data.customerId,
        invoiceDate: new Date(data.invoiceDate),
        dueDate: new Date(data.dueDate),
        warehouseId: data.warehouseId,
        
        // Financials
        // currencyId: ... (removed strict check for brevity, assumed base)
        exchangeRate: "1", 
        subtotal: subTotal.toFixed(2),
        discountAmount: totalDiscount.toFixed(2),
        taxAmount: totalTax.toFixed(2),
        totalAmount: grandTotal.toFixed(2),
        balanceAmount: grandTotal.toFixed(2),
        
        status: "draft",
        notes: data.notes,
        isPosted: false,
      }).returning();

      // 4. Insert Invoice Lines
      if (lineItems.length > 0) {
        await tx.insert(salesLines).values(
            lineItems.map((item, idx) => ({
                companyId,
                invoiceId: newInvoice.id,
                lineNumber: idx + 1,
                itemId: item.itemId,
                description: item.description || "Item Sale",
                quantity: item.quantity.toString(),
                uom: "PCS", 
                unitPrice: item.unitPrice.toFixed(2),
                discountAmount: item.discountAmount.toFixed(2),
                taxAmount: item.lineTax.toFixed(2),
                lineTotal: item.lineTotal.toFixed(2),
            }))
        );
      }

      // 5. Automatic COA Posting (GL Service)
      // Fetch GL Mapping
      const defaults = await tx.query.defaultGlAccounts.findMany({
          where: eq(defaultGlAccounts.companyId, companyId)
      });
      const getDef = (key: string) => defaults.find(d => d.mappingKey === key)?.accountId;

      // Map to service interface
      const glMapping = {
        salesRevenue: getDef("DEFAULT_SALES") || "",
        salesVat: getDef("VAT_PAYABLE") || "",
        accountsReceivable: getDef("DEFAULT_RECEIVABLE") || "",
        inventory: getDef("DEFAULT_INVENTORY") || "",
        costOfGoodsSold: getDef("DEFAULT_COGS") || "",
        accountsPayable: getDef("DEFAULT_PAYABLE") || "",
        purchaseVat: getDef("VAT_RECEIVABLE") || "",
        bank: getDef("DEFAULT_BANK") || "",
        cash: getDef("DEFAULT_CASH") || "",
        payrollExpense: getDef("PAYROLL_EXPENSE") || "",
        payrollPayable: getDef("PAYROLL_PAYABLE") || ""
      };

      // Check for critical missing accounts (optional, relying on service validation)
      if (!glMapping.salesRevenue || !glMapping.accountsReceivable) {
        console.warn("GL Posting Warning: Missing default sales/AR accounts.");
      }

      await postSalesInvoiceToGL(
        newInvoice.id,
        invoiceNumber,
        new Date(data.invoiceDate),
        data.customerId,
        Number(subTotal),
        Number(totalTax),
        Number(grandTotal),
        glMapping
      );

      // Always mark as posted if we reached here without error (service throws if fails)
      await tx.update(salesInvoices)
        .set({ isPosted: true })
        .where(eq(salesInvoices.id, newInvoice.id));

      return { 
          success: true, 
          message: "Invoice created successfully", 
          invoiceId: newInvoice.id 
      };

    }); // End Transaction

  } catch (error: any) {
    console.error("Create Invoice Action Error:", error);
    return { success: false, message: error.message || "Failed to create invoice" };
  }
}

// --- Data Fetchers ---

export async function getInvoiceMasterData() {
  const [allCustomers, allItems, allWarehouses] = await Promise.all([
    db.query.customers.findMany({ 
        where: eq(customers.isActive, true),
        columns: { id: true, name: true } 
    }),
    db.query.items.findMany({ 
        where: eq(items.isActive, true),
        columns: { id: true, name: true, code: true, sellingPrice: true, taxPercent: true } 
    }),
    db.query.warehouses.findMany({ 
        where: eq(warehouses.isActive, true),
        columns: { id: true, name: true }
    })
  ]);
  
  return {
    customers: allCustomers,
    items: allItems,
    warehouses: allWarehouses
  };
}
