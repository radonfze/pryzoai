"use server";

import { db } from "@/db";
import { journalEntries, journalLines, chartOfAccounts } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getCompanyId } from "@/lib/auth";
import { generateNextNumber } from "@/lib/services/number-generator";
import { validatePostingPeriod } from "@/lib/services/period-service";

/**
 * GL Posting Service
 * Standardized service for creating General Ledger entries
 * across all modules (Sales, Purchase, Inventory, Payroll)
 */

export interface GLLine {
  accountId: string;
  debit?: number;
  credit?: number;
  description?: string;
  costCenterId?: string;
}

export interface GLPostingParams {
  sourceType: 'sales_invoice' | 'purchase_bill' | 'payment' | 'receipt' | 'stock_adjustment' | 'payroll' | 'manual' | 'reversal';
  sourceId: string;
  sourceNumber: string;
  postingDate: Date;
  description: string;
  lines: GLLine[];
  branchId?: string;
  isReversal?: boolean;
  originalJournalId?: string;
  tx?: any; // Transaction context
}

export interface GLPostingResult {
  success: boolean;
  journalId?: string;
  journalNumber?: string;
  error?: string;
}

/**
 * Create a GL posting (journal entry) with proper validation
 */
export async function createGLPosting(params: GLPostingParams): Promise<GLPostingResult> {
  try {
    const database = params.tx || db;
    const companyId = await getCompanyId();

    // 0. Validate Fiscal Period (New Security Layer)
    // We only validate period for new postings, not necessarily for historical migrations or system overrides if needed later.
    // But for standard flow, this is critical.
    if (params.sourceType !== 'reversal') { 
        // Reversals might need special handling, but generally even reversals should only happen in OPEN periods (current period).
        // Let's enforce it for everything for now.
        await validatePostingPeriod(params.postingDate, companyId, database);
    } else {
        // Even for reversals, the "Reveral Entry" date must be in an open period.
        await validatePostingPeriod(params.postingDate, companyId, database);
    }
    
    // Validate lines balance (debits = credits)
    const totalDebits = params.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredits = params.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
    
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      return {
        success: false,
        error: `Journal entry is unbalanced. Debits: ${totalDebits}, Credits: ${totalCredits}`
      };
    }
    
    // Validate all accounts exist
    for (const line of params.lines) {
      const account = await database.query.chartOfAccounts.findFirst({
        where: eq(chartOfAccounts.id, line.accountId)
      });
      
      if (!account) {
        return {
          success: false,
          error: `Account not found: ${line.accountId}`
        };
      }
    }
    
    // Generate journal number
    const numResult = await generateNextNumber({
      companyId,
      entityType: "journal_entries",
      documentType: "JV"
    });
    const journalNumber = numResult.number || `JV-${Date.now()}`;
    
    // Create journal entry
    const [journal] = await database.insert(journalEntries).values({
      companyId,
      branchId: params.branchId,
      journalNumber: journalNumber,
      journalDate: params.postingDate.toISOString().split('T')[0], // Ensure string format
      description: params.description,
      sourceDocType: params.sourceType === 'sales_invoice' ? 'INV' : params.sourceType === 'purchase_bill' ? 'BILL' : 'JV', // Map to varchar enum if needed or keep consistent
      sourceDocId: params.sourceId,
      sourceDocNumber: params.sourceNumber,
      totalDebit: String(totalDebits),
      totalCredit: String(totalCredits),
      status: "posted",
      isReversal: params.isReversal || false,
      reversalOfId: params.originalJournalId,
    }).returning();
    
    // Create journal lines
    const lineValues = params.lines.map((line, index) => ({
      companyId,
      journalEntryId: journal.id,
      lineNumber: index + 1,
      accountId: line.accountId,
      description: line.description || params.description,
      debitAmount: String(line.debit || 0),
      creditAmount: String(line.credit || 0),
      costCenterId: line.costCenterId,
    }));
    
    await database.insert(journalLines).values(lineValues);
    
    // Update account balances
    for (const line of params.lines) {
      const netAmount = (line.debit || 0) - (line.credit || 0);
      await database.update(chartOfAccounts)
        .set({
          currentBalance: sql`${chartOfAccounts.currentBalance} + ${netAmount}`,
          updatedAt: new Date(),
        })
        .where(eq(chartOfAccounts.id, line.accountId));
    }
    
    return {
      success: true,
      journalId: journal.id,
      journalNumber: journal.journalNumber,
    };
    
  } catch (error: any) {
    console.error("[GLPostingService] Error:", error);
    return {
      success: false,
      error: error.message || "Failed to create GL posting"
    };
  }
}

/**
 * Create a reversal journal entry for an existing journal
 */
export async function createReversalPosting(
  originalJournalId: string,
  reversalDate: Date,
  reason: string,
  tx?: any
): Promise<GLPostingResult> {
  try {
    const database = tx || db;
    const companyId = await getCompanyId();
    
    // Get original journal with lines
    const originalJournal = await database.query.journalEntries.findFirst({
      where: eq(journalEntries.id, originalJournalId),
      with: { lines: true }
    });
    
    if (!originalJournal) {
      return { success: false, error: "Original journal not found" };
    }
    
    if (originalJournal.isReversal) {
      return { success: false, error: "Cannot reverse a reversal entry" };
    }
    
    // Create reversed lines (swap debit/credit)
    const reversedLines: GLLine[] = originalJournal.lines.map(line => ({
      accountId: line.accountId,
      debit: Number(line.creditAmount),
      credit: Number(line.debitAmount),
      description: `Reversal of ${originalJournal.journalNumber}: ${reason}`,
    }));
    
    return createGLPosting({
      sourceType: 'reversal',
      sourceId: originalJournalId,
      sourceNumber: originalJournal.journalNumber,
      postingDate: reversalDate,
      description: `Reversal of ${originalJournal.journalNumber}: ${reason}`,
      lines: reversedLines,
      branchId: originalJournal.branchId || undefined,
      isReversal: true,
      originalJournalId: originalJournalId,
      tx // Pass transaction
    });
    
  } catch (error: any) {
    console.error("[GLPostingService] Reversal error:", error);
    return {
      success: false,
      error: error.message || "Failed to create reversal"
    };
  }
}

/**
 * GL Account mapping for automatic posting
 */
export interface GLAccountMapping {
  salesRevenue: string;
  salesVat: string;
  accountsReceivable: string;
  inventory: string;
  costOfGoodsSold: string;
  accountsPayable: string;
  purchaseVat: string;
  bank: string;
  cash: string;
  payrollExpense: string;
  payrollPayable: string;
}

/**
 * Get GL account mapping for a company
 */
export async function getGLMapping(companyId: string): Promise<GLAccountMapping | null> {
  // TODO: Fetch from gl_mappings table
  // For now, return null - caller should handle missing mapping
  return null;
}

/**
 * Post Sales Invoice to GL
 */
export async function postSalesInvoiceToGL(
  invoiceId: string,
  invoiceNumber: string,
  invoiceDate: Date,
  customerId: string,
  subtotal: number,
  vatAmount: number,
  total: number,
  glMapping: GLAccountMapping,
  tx?: any
): Promise<GLPostingResult> {
  const lines: GLLine[] = [
    // Debit: Accounts Receivable
    {
      accountId: glMapping.accountsReceivable,
      debit: total,
      description: `Invoice ${invoiceNumber} - Customer Receivable`
    },
    // Credit: Sales Revenue
    {
      accountId: glMapping.salesRevenue,
      credit: subtotal,
      description: `Invoice ${invoiceNumber} - Sales Revenue`
    },
  ];
  
  // Add VAT line if applicable
  if (vatAmount > 0) {
    lines.push({
      accountId: glMapping.salesVat,
      credit: vatAmount,
      description: `Invoice ${invoiceNumber} - Output VAT`
    });
  }
  
  return createGLPosting({
    sourceType: 'sales_invoice',
    sourceId: invoiceId,
    sourceNumber: invoiceNumber,
    postingDate: invoiceDate,
    description: `Sales Invoice ${invoiceNumber}`,
    lines,
    tx // Pass transaction
  });
}

/**
 * Post Purchase Bill to GL
 */
export async function postPurchaseBillToGL(
  billId: string,
  billNumber: string,
  billDate: Date,
  supplierId: string,
  subtotal: number,
  vatAmount: number,
  total: number,
  glMapping: GLAccountMapping,
  tx?: any
): Promise<GLPostingResult> {
  const lines: GLLine[] = [
    // Debit: Inventory/Expense
    {
      accountId: glMapping.inventory,
      debit: subtotal,
      description: `Bill ${billNumber} - Inventory/Expense`
    },
    // Credit: Accounts Payable
    {
      accountId: glMapping.accountsPayable,
      credit: total,
      description: `Bill ${billNumber} - Supplier Payable`
    },
  ];
  
  // Add VAT line if applicable
  if (vatAmount > 0) {
    lines[0].debit = subtotal; // Adjust inventory to net
    lines.push({
      accountId: glMapping.purchaseVat,
      debit: vatAmount,
      description: `Bill ${billNumber} - Input VAT`
    });
  }
  
  return createGLPosting({
    sourceType: 'purchase_bill',
    sourceId: billId,
    sourceNumber: billNumber,
    postingDate: billDate,
    description: `Purchase Bill ${billNumber}`,
    lines,
    tx // Pass transaction
  });
}

/**
 * Post Customer Payment to GL
 */
export async function postPaymentToGL(
  paymentId: string,
  paymentNumber: string,
  paymentDate: Date,
  amount: number,
  paymentMethod: 'cash' | 'bank' | 'cheque',
  glMapping: GLAccountMapping,
  tx?: any
): Promise<GLPostingResult> {
  const bankAccount = paymentMethod === 'cash' ? glMapping.cash : glMapping.bank;
  
  return createGLPosting({
    sourceType: 'receipt',
    sourceId: paymentId,
    sourceNumber: paymentNumber,
    postingDate: paymentDate,
    description: `Customer Payment ${paymentNumber}`,
    lines: [
      {
        accountId: bankAccount,
        debit: amount,
        description: `Payment ${paymentNumber} - Bank/Cash Received`
      },
      {
        accountId: glMapping.accountsReceivable,
        credit: amount,
        description: `Payment ${paymentNumber} - AR Reduction`
      }
    ],
    tx // Pass transaction
  });
}

/**
 * Post Stock Adjustment to GL
 */
export async function postStockAdjustmentToGL(
  adjustmentId: string,
  adjustmentNumber: string,
  adjustmentDate: Date,
  totalVarianceValue: number,
  glMapping: GLAccountMapping,
  tx?: any
): Promise<GLPostingResult> {
  // For stock adjustments:
  // - Positive variance (found more stock) = Debit Inventory, Credit COGS
  // - Negative variance (found less stock) = Debit COGS, Credit Inventory
  
  const lines: GLLine[] = [];
  
  if (totalVarianceValue > 0) {
    // Found more stock than expected
    lines.push(
      {
        accountId: glMapping.inventory,
        debit: totalVarianceValue,
        description: `Adjustment ${adjustmentNumber} - Inventory Increase`
      },
      {
        accountId: glMapping.costOfGoodsSold,
        credit: totalVarianceValue,
        description: `Adjustment ${adjustmentNumber} - COGS Reversal`
      }
    );
  } else if (totalVarianceValue < 0) {
    // Found less stock than expected
    const absValue = Math.abs(totalVarianceValue);
    lines.push(
      {
        accountId: glMapping.costOfGoodsSold,
        debit: absValue,
        description: `Adjustment ${adjustmentNumber} - Stock Shortage`
      },
      {
        accountId: glMapping.inventory,
        credit: absValue,
        description: `Adjustment ${adjustmentNumber} - Inventory Decrease`
      }
    );
  } else {
    // No variance, nothing to post
    return { success: true, journalNumber: "No posting required" };
  }
  
  return createGLPosting({
    sourceType: 'stock_adjustment',
    sourceId: adjustmentId,
    sourceNumber: adjustmentNumber,
    postingDate: adjustmentDate,
    description: `Stock Adjustment ${adjustmentNumber}`,
    lines,
    tx
  });
}
