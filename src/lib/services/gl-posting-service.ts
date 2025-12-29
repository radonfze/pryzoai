"use server";

import { db } from "@/db";
import { journalEntries, journalLines, chartOfAccounts } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getCompanyId } from "@/lib/auth";
import { generateNextNumber } from "@/lib/services/number-generator";

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
    const companyId = await getCompanyId();
    
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
      const account = await db.query.chartOfAccounts.findFirst({
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
    const journalNumber = await generateNextNumber(companyId, "JV", "journal_entries");
    
    // Create journal entry
    const [journal] = await db.insert(journalEntries).values({
      companyId,
      branchId: params.branchId,
      entryNumber: journalNumber,
      entryDate: params.postingDate,
      description: params.description,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
      sourceNumber: params.sourceNumber,
      totalDebit: String(totalDebits),
      totalCredit: String(totalCredits),
      status: "posted",
      isReversal: params.isReversal || false,
      originalEntryId: params.originalJournalId,
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
    
    await db.insert(journalLines).values(lineValues);
    
    // Update account balances
    for (const line of params.lines) {
      const netAmount = (line.debit || 0) - (line.credit || 0);
      await db.update(chartOfAccounts)
        .set({
          currentBalance: sql`${chartOfAccounts.currentBalance} + ${netAmount}`,
          updatedAt: new Date(),
        })
        .where(eq(chartOfAccounts.id, line.accountId));
    }
    
    return {
      success: true,
      journalId: journal.id,
      journalNumber: journal.entryNumber,
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
  reason: string
): Promise<GLPostingResult> {
  try {
    const companyId = await getCompanyId();
    
    // Get original journal with lines
    const originalJournal = await db.query.journalEntries.findFirst({
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
      description: `Reversal of ${originalJournal.entryNumber}: ${reason}`,
    }));
    
    return createGLPosting({
      sourceType: 'reversal',
      sourceId: originalJournalId,
      sourceNumber: originalJournal.entryNumber,
      postingDate: reversalDate,
      description: `Reversal of ${originalJournal.entryNumber}: ${reason}`,
      lines: reversedLines,
      branchId: originalJournal.branchId || undefined,
      isReversal: true,
      originalJournalId: originalJournalId,
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
  glMapping: GLAccountMapping
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
  glMapping: GLAccountMapping
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
  glMapping: GLAccountMapping
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
  });
}
