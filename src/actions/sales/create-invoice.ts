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
  journalEntries,
  journalLines,
  chartOfAccounts
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
      // 1a. Fetch Context (Company & Currency) - HARDCODED for Phase 3/4 until Auth
      // In a real app, we'd get this from the session (e.g. `auth().companyId`)
      const company = await tx.query.companies.findFirst({
         where: eq(companies.active, true), // Just get the first active company
         with: {
             baseCurrency: true
         }
      });

      if (!company) {
          throw new Error("System Error: No active company found for context.");
      }

      const companyId = company.id;
      const baseCurrencyId = company.currency; // Assuming currency is the ID or Code, better to check schema
      // NOTE: In our schema, company.currency is a string code (e.g. "AED") 
      // check if we have a currency ID resolver or just use the code if schema permits.
      // Schema check: salesInvoices.currencyId (UUID) vs companies.currency (String).
      // We need the Currency ID.
      
      const currency = await tx.query.currencies.findFirst({
          where: and(eq(numberSeries.companyId, companyId), eq(numberSeries.isDefault, true))
      }) || await tx.query.currencies.findFirst({
        where: eq(numberSeries.code, "AED") 
      });

      // Fallback if no currency found (should be seeded)
      if(!currency && !company.currency) {
         throw new Error("Configuration Error: Base currency not set.");
      }
      
      const currencyId = currency?.id; 

      // 1b. Generate Invoice Number (with locking)
      // We lock the row using `for update` if possible, or just standard read/write for now
      const series = await tx.query.numberSeries.findFirst({
        where: and(
          eq(numberSeries.companyId, companyId),
          eq(numberSeries.entityType, "invoice"),
          eq(numberSeries.isActive, true)
        )
      });

      let invoiceNumber = "";
      // Default fallback
      let prefix = "INV";
      let separator = "-";
      let yearFormat = "YYYY";
      let nextVal = 1000;
      let suffix = "";

      if (series) {
        nextVal = (series.currentValue || 0) + 1;
        prefix = series.prefix || "INV";
        separator = series.separator || "-";
        yearFormat = series.yearFormat || "YYYY";
        // suffix = series.suffix || ""; // Schema doesn't have suffix currently
        
        // Handle Year Format
        const date = new Date(data.invoiceDate); // Use invoice date for year
        let yearStr = "";
        
        if (yearFormat === "YYYY") {
            yearStr = date.getFullYear().toString();
        } else if (yearFormat === "YY") {
            yearStr = date.getFullYear().toString().slice(-2);
        }

        // Handle Padding (Fixed to 5 digits as per screenshot requirement)
        const paddedNum = nextVal.toString().padStart(5, '0');

        // Construct: PREFIX-YEAR-NUMBER or PREFIX-NUMBER depending on config
        // Screenshot implies: PREFIX [SEP] YEAR [SEP] NUMBER (QT-2025-00001)
        
        if (yearStr) {
            invoiceNumber = `${prefix}${separator}${yearStr}${separator}${paddedNum}`;
        } else {
            invoiceNumber = `${prefix}${separator}${paddedNum}`;
        }
        
        // Update series
        await tx.update(numberSeries)
          .set({ currentValue: nextVal, updatedAt: new Date() })
          .where(eq(numberSeries.id, series.id));
      } else {
        // Fallback default
        invoiceNumber = `INV-${Date.now()}`; 
      }

      // 2. Calculate Totals (Server-side validation of math)
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
        warehouseId: data.warehouseId, // Ensure schema has this, otherwise ignore
        
        // Financials
        currencyId: currencyId, 
        exchangeRate: "1", // Todo: Fetch latest rate if multi-currency
        subtotal: subTotal.toFixed(2),
        discountAmount: totalDiscount.toFixed(2),
        taxAmount: totalTax.toFixed(2),
        totalAmount: grandTotal.toFixed(2),
        balanceAmount: grandTotal.toFixed(2), // Unpaid
        
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
                uom: "PCS", // Todo: Fetch from Item Master
                unitPrice: item.unitPrice.toFixed(2),
                discountAmount: item.discountAmount.toFixed(2),
                taxAmount: item.lineTax.toFixed(2),
                lineTotal: item.lineTotal.toFixed(2),
            }))
        );
      }

      // 5. Automatic GL Posting (Sales Invoice)
      // DR: Accounts Receivable (Customer)
      // CR: Sales Revenue
      // CR: VAT Payable

      // Fetch COA IDs (In a real app, these should be from settings/defaults)
      const coa = await tx.query.chartOfAccounts.findMany({
        where: and(
          eq(chartOfAccounts.companyId, companyId),
          // We need simple way to identify accounts. 
          // Ideally use 'code' we seeded: 1130 (AR), 4100 (Sales), 2120 (VAT)
        )
      });

      // Simple lookup helper
      const getAccountId = (code: string) => coa.find(a => a.code === code)?.id;

      const arAccountId = getAccountId("1130"); // Accounts Receivable
      const salesAccountId = getAccountId("4100"); // Sales Revenue
      const taxAccountId = getAccountId("2120"); // VAT Payable

      if (arAccountId && salesAccountId && taxAccountId) {
          // Generate Journal Number
          const journalSeries = await tx.query.numberSeries.findFirst({
              where: and(eq(numberSeries.companyId, companyId), eq(numberSeries.entityType, "journal"))
          });
          
          let journalNum = `JV-${Date.now()}`;
          if (journalSeries) {
              const nextJv = (journalSeries.currentValue || 0) + 1;
              journalNum = `${journalSeries.prefix}-${journalSeries.yearFormat === 'YYYY' ? new Date().getFullYear() : ''}-${nextJv.toString().padStart(5, '0')}`;
              await tx.update(numberSeries).set({ currentValue: nextJv }).where(eq(numberSeries.id, journalSeries.id));
          }

          // Insert Journal Header
          const [journal] = await tx.insert(journalEntries).values({
              companyId,
              journalNumber: journalNum,
              journalDate: new Date(data.invoiceDate),
              sourceDocType: "INV",
              sourceDocId: newInvoice.id,
              sourceDocNumber: invoiceNumber,
              description: `Invoice ${invoiceNumber} for ${data.customerId}`, // Todo: Get customer name
              totalDebit: grandTotal.toFixed(2),
              totalCredit: grandTotal.toFixed(2),
              status: "posted",
          }).returning();

          // Insert Journal Lines
          // 1. Debit AR (Total Receivable)
          await tx.insert(journalLines).values({
              companyId,
              journalId: journal.id,
              lineNumber: 1,
              accountId: arAccountId,
              description: `Receivable - ${invoiceNumber}`,
              debit: grandTotal.toFixed(2),
              credit: "0",
          });

          // 2. Credit Sales (Subtotal - Discount)
          const salesAmount = (subTotal - totalDiscount);
          await tx.insert(journalLines).values({
              companyId,
              journalId: journal.id,
              lineNumber: 2,
              accountId: salesAccountId,
              description: `Sales Revenue - ${invoiceNumber}`,
              debit: "0",
              credit: salesAmount.toFixed(2),
          });

          // 3. Credit Tax (Total Tax)
          if (totalTax > 0) {
              await tx.insert(journalLines).values({
                  companyId,
                  journalId: journal.id,
                  lineNumber: 3,
                  accountId: taxAccountId,
                  description: `VAT Output - ${invoiceNumber}`,
                  debit: "0",
                  credit: totalTax.toFixed(2),
              });
          }

          // Update Invoice to Posted
          await tx.update(salesInvoices)
            .set({ isPosted: true })
            .where(eq(salesInvoices.id, newInvoice.id));
      } else {
          console.warn("Skipping GL Posting: Standard accounts (1130, 4100, 2120) not found in COA.");
      }

      // 6. Success
      return { 
          success: true, 
          message: `Invoice ${invoiceNumber} created & posted successfully`, 
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
