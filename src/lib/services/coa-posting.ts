"use server";

import { db } from "@/db";
import { chartOfAccounts } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * COA Auto-Posting Engine
 * 
 * Automatically posts transactions to GL accounts based on document type.
 * Supports double-entry bookkeeping with debit/credit pairs.
 */

// Standard GL account mappings by document type
const GL_MAPPINGS = {
  // Sales Invoice: DR Accounts Receivable, CR Sales Revenue, CR VAT Payable
  SALES_INVOICE: {
    debit: ["accounts_receivable"],
    credit: ["sales_revenue", "tax_payable"],
  },
  // Customer Payment: DR Bank/Cash, CR Accounts Receivable
  CUSTOMER_PAYMENT: {
    debit: ["cash_bank"],
    credit: ["accounts_receivable"],
  },
  // Purchase Bill: DR Inventory/Expense, DR VAT Receivable, CR Accounts Payable
  PURCHASE_BILL: {
    debit: ["inventory", "tax_payable"],
    credit: ["accounts_payable"],
  },
  // Supplier Payment: DR Accounts Payable, CR Bank/Cash
  SUPPLIER_PAYMENT: {
    debit: ["accounts_payable"],
    credit: ["cash_bank"],
  },
  // Payroll: DR Payroll Expense, CR Bank/Cash, CR Tax Payable
  PAYROLL: {
    debit: ["payroll_expense"],
    credit: ["cash_bank", "tax_payable"],
  },
  // Stock Transfer: DR Inventory (dest), CR Inventory (source)
  STOCK_TRANSFER: {
    debit: ["inventory"],
    credit: ["inventory"],
  },
};

interface JournalEntry {
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

interface PostingResult {
  success: boolean;
  entries?: JournalEntry[];
  error?: string;
}

/**
 * Get the GL account for a specific account group
 */
async function getGLAccount(
  companyId: string,
  accountGroup: string
): Promise<{ id: string; code: string; name: string } | null> {
  const account = await db.query.chartOfAccounts.findFirst({
    where: and(
      eq(chartOfAccounts.companyId, companyId),
      eq(chartOfAccounts.accountGroup, accountGroup as any),
      eq(chartOfAccounts.isActive, true)
    ),
  });

  if (!account) return null;
  return { id: account.id, code: account.code, name: account.name };
}

/**
 * Generate journal entries for a document
 */
export async function generateJournalEntries(params: {
  companyId: string;
  documentType: keyof typeof GL_MAPPINGS;
  totalAmount: number;
  vatAmount?: number;
  description?: string;
}): Promise<PostingResult> {
  const { companyId, documentType, totalAmount, vatAmount = 0 } = params;

  const mapping = GL_MAPPINGS[documentType];
  if (!mapping) {
    return { success: false, error: `Unknown document type: ${documentType}` };
  }

  const entries: JournalEntry[] = [];
  const netAmount = totalAmount - vatAmount;

  try {
    // Generate debit entries
    for (const accountGroup of mapping.debit) {
      const account = await getGLAccount(companyId, accountGroup);
      if (!account) {
        return { success: false, error: `GL account not found for ${accountGroup}` };
      }

      const amount = accountGroup.includes("tax") ? vatAmount : netAmount;
      if (amount > 0) {
        entries.push({
          accountId: account.id,
          accountCode: account.code,
          accountName: account.name,
          debit: amount,
          credit: 0,
        });
      }
    }

    // Generate credit entries
    for (const accountGroup of mapping.credit) {
      const account = await getGLAccount(companyId, accountGroup);
      if (!account) {
        return { success: false, error: `GL account not found for ${accountGroup}` };
      }

      const amount = accountGroup.includes("tax") ? vatAmount : 
                     accountGroup === "sales_revenue" ? netAmount : totalAmount;
      if (amount > 0) {
        entries.push({
          accountId: account.id,
          accountCode: account.code,
          accountName: account.name,
          debit: 0,
          credit: amount,
        });
      }
    }

    // Validate double-entry (debits = credits)
    const totalDebits = entries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredits = entries.reduce((sum, e) => sum + e.credit, 0);

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      return {
        success: false,
        error: `Unbalanced entry: Debits ${totalDebits} != Credits ${totalCredits}`,
      };
    }

    return { success: true, entries };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Post a document to the General Ledger
 */
export async function postToGL(params: {
  companyId: string;
  documentType: keyof typeof GL_MAPPINGS;
  documentId: string;
  documentNumber: string;
  totalAmount: number;
  vatAmount?: number;
  postingDate: Date;
  description?: string;
  createdBy?: string;
}): Promise<PostingResult> {
  const { companyId, documentType, totalAmount, vatAmount } = params;

  // Generate journal entries
  const result = await generateJournalEntries({
    companyId,
    documentType,
    totalAmount,
    vatAmount,
    description: params.description,
  });

  if (!result.success || !result.entries) {
    return result;
  }

  // TODO: Insert into journal_entries table
  // This would create actual journal entry records in the database

  return result;
}

/**
 * Reverse a GL posting (for cancellations/voids)
 */
export async function reverseGLPosting(params: {
  companyId: string;
  originalDocumentId: string;
  reversalDate: Date;
  reason: string;
  createdBy?: string;
}): Promise<PostingResult> {
  // TODO: Look up original entries and create reversing entries
  return { success: true, entries: [] };
}
