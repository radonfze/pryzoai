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
import { getCompanyId, getSession } from "@/lib/auth";
import { validateCustomerCredit, updateCustomerOutstandingBalance } from "@/lib/services/credit-validation-service";
import { logDocumentAction } from "@/lib/services/document-history-service";


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
  invoiceNumber?: string; // Optional: pre-reserved number from UI
}

export interface ActionResponse {
  success: boolean;
  message: string;
  invoiceId?: string;
}

// --- Action ---

export async function createInvoiceAction(data: InvoiceFormState): Promise<ActionResponse> {
  console.log("createInvoiceAction called with:", { 
    ...data, 
    items: data.items.length + " items" 
  });
  try {
    // 0. Preliminary Validation
    if (!data.customerId || !data.items.length) {
      return { success: false, message: "Customer and at least one item are required." };
    }

    // 0a. Get session and company BEFORE transaction
    console.log("🔐 Attempting to get session...");
    const session = await getSession();
    console.log("🔐 Session result:", session ? "Found" : "NULL");
    console.log("🔐 Session details:", JSON.stringify(session, null, 2));
    
    console.log("🏢 Attempting to get companyId...");
    let companyId: string;
    try {
      companyId = await getCompanyId();
      console.log("🏢 CompanyId:", companyId);
    } catch (error: any) {
      console.error("🏢 getCompanyId() failed:", error.message);
      return { success: false, message: error.message || "Session error" };
    }
    
    if (!companyId) {
      console.error("🏢 No companyId found");
      return { success: false, message: "Unauthorized: No active company session." };
    }

    // 0b. Estimate total for credit check
    const estimatedTotal = data.items.reduce((sum, item) => sum + item.totalAmount, 0);

    // 0c. Credit Limit Validation (before transaction)
    const creditCheck = await validateCustomerCredit(data.customerId, estimatedTotal);
    if (!creditCheck.allowed) {
      return { 
        success: false, 
        message: `Credit limit exceeded: ${creditCheck.message}` 
      };
    }

    // 1. Transaction Wrapper
    return await db.transaction(async (tx) => {

      // 1b. Use provided invoice number or generate new one
      let invoiceNumber: string;
      
      if (data.invoiceNumber) {
        // Number was pre-reserved by the UI
        invoiceNumber = data.invoiceNumber;
      } else {
        // Fallback: Generate number now (legacy flow)
        const numResult = await generateNextNumber({
          companyId,
          entityType: "invoice",
          documentType: "INV",
          created_by: "system" 
        });

        if (!numResult.success || !numResult.number) {
          if (numResult.error?.includes("No active number series")) {
            throw new Error("Missing Number Series for Invoices. Please configure in Settings.");
          }
          throw new Error(numResult.error || "Failed to generate invoice number");
        }
        
        invoiceNumber = numResult.number;
      }

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
        invoiceDate: data.invoiceDate, // Already in YYYY-MM-DD string format
        dueDate: data.dueDate,         // Already in YYYY-MM-DD string format
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
        console.log(`Inserting ${lineItems.length} lines for invoice ${newInvoice.id}`);
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

      let glStatus = "posted";
      let glMessage = "";

      // TEMPORARILY DISABLED FOR DEBUGGING
      /*
      try {
        await postSalesInvoiceToGL(
          newInvoice.id,
          invoiceNumber,
          data.invoiceDate, // Already a string in YYYY-MM-DD format
          data.customerId,
          Number(subTotal),
          Number(totalTax),
          Number(grandTotal),
          glMapping,
          tx // 5b. Pass transaction context
        );

        // 6. [NEW] Auto-Deduct Inventory (Fix applied)
        // Deduct stock for each line item
        if (lineItems.length > 0) {
            const { createStockMovement } = await import("@/lib/services/inventory-movement-service");
            
            for(const item of lineItems) {
                await createStockMovement({
                    transactionType: "issue", // Sale = Issue
                    companyId,
                    warehouseId: data.warehouseId,
                    itemId: item.itemId,
                    quantity: item.quantity,
                    uom: "PCS",
                    documentType: "INV",
                    documentId: newInvoice.id,
                    documentNumber: invoiceNumber,
                    notes: `Invoice Sale: ${invoiceNumber}`,
                    tx // Pass transaction
                });
            }
        }

        // Mark as posted only if success
        await tx.update(salesInvoices)
          .set({ isPosted: true })
          .where(eq(salesInvoices.id, newInvoice.id));
          
      } catch (glError: any) {
         console.warn("GL/Inventory Posting Failed:", glError);
         glStatus = "draft";
         glMessage = ` (Saved as DRAFT. Posting Failed: ${glError.message || "Unknown error"})`;
         
         // Revert posted status just in case (though it defaults to false)
         await tx.update(salesInvoices)
          .set({ isPosted: false })
          .where(eq(salesInvoices.id, newInvoice.id));
      }
      */
      console.log("GL posting and inventory movement temporarily disabled for debugging");

      // 7. Log document history (TEMPORARILY DISABLED)
      /*
      try {
        await logDocumentAction({
          documentId: newInvoice.id,
          documentType: "invoice",
          documentNumber: invoiceNumber,
          action: "CREATE",
          newValue: {
            customerId: data.customerId,
            invoiceDate: data.invoiceDate,
            dueDate: data.dueDate,
            totalAmount: grandTotal,
            lineCount: lineItems.length,
          },
        }, session?.userId);
      } catch (historyError) {
        console.warn("Failed to log document history:", historyError);
      }
      */

      // 8. Update customer outstanding balance (TEMPORARILY DISABLED)
      /*
      updateCustomerOutstandingBalance(data.customerId).catch(err => {
        console.warn("Failed to update customer balance:", err);
      });
      */

      return { 
          success: true, 
          message: "Invoice created" + glMessage, 
          invoiceId: newInvoice.id 
      };

    }); // End Transaction

  } catch (error: any) {
    console.error("❌ Create Invoice Action Error:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack?.split('\n').slice(0, 5)
    });
    return { success: false, message: error.message || "Failed to create invoice" };
  }
}

// --- Data Fetchers ---

export async function getInvoiceMasterData() {
  const [allCustomers, allItems, allWarehouses] = await Promise.all([
    db.query.customers.findMany({ 
        where: eq(customers.isActive, true),
        columns: { id: true, name: true, paymentTermDays: true } 
    }),
    db.query.items.findMany({ 
        where: eq(items.isActive, true),
        columns: { id: true, name: true, code: true, sellingPrice: true, costPrice: true, taxPercent: true } 
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
