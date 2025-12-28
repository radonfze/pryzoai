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
/**
 * Generate journal entries for a document
 */
export async function generateJournalEntries(params: {
  companyId: string;
  documentType: keyof typeof GL_MAPPINGS;
  totalAmount: number;
  vatAmount?: number;
  description?: string;
  overrides?: Record<string, string>; // Map semantic key (e.g. "sales_revenue") to Account ID
}): Promise<PostingResult> {
  const { companyId, documentType, totalAmount, vatAmount = 0, overrides = {} } = params;

  const mapping = GL_MAPPINGS[documentType];
  if (!mapping) {
    return { success: false, error: `Unknown document type: ${documentType}` };
  }

  const entries: JournalEntry[] = [];
  const netAmount = totalAmount - vatAmount;

  try {
    // Generate debit entries
    for (const accountGroup of mapping.debit) {
      // 1. Check override
      let accountId = overrides[accountGroup];
      let accountCode = "MANUAL";
      let accountName = "Manual Override";

      // 2. If no override, look up by Group
      if (!accountId) {
          const account = await getGLAccount(companyId, accountGroup);
          if (!account) {
            return { success: false, error: `GL account not found for ${accountGroup}` };
          }
          accountId = account.id;
          accountCode = account.code;
          accountName = account.name;
      }

      const amount = accountGroup.includes("tax") ? vatAmount : netAmount;
      if (amount > 0) {
        entries.push({
          accountId,
          accountCode,
          accountName,
          debit: amount,
          credit: 0,
        });
      }
    }

    // Generate credit entries
    for (const accountGroup of mapping.credit) {
       // 1. Check override
      let accountId = overrides[accountGroup];
      let accountCode = "MANUAL";
      let accountName = "Manual Override";

      // 2. If no override, look up by Group
      if (!accountId) {
          const account = await getGLAccount(companyId, accountGroup);
          if (!account) {
            return { success: false, error: `GL account not found for ${accountGroup}` };
          }
          accountId = account.id;
          accountCode = account.code;
          accountName = account.name;
      }

      const amount = accountGroup.includes("tax") ? vatAmount : 
                     accountGroup === "sales_revenue" ? netAmount : totalAmount;
      if (amount > 0) {
        entries.push({
          accountId,
          accountCode,
          accountName,
          debit: 0,
          credit: amount,
        });
      }
    }

    // Validate double-entry
    const totalDebits = entries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredits = entries.reduce((sum, e) => sum + e.credit, 0);
    
    // Allow small float variance
    if (Math.abs(totalDebits - totalCredits) > 0.05) {
      return {
        success: false,
        error: `Unbalanced entry: Debits ${totalDebits.toFixed(2)} != Credits ${totalCredits.toFixed(2)}`,
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
import { journalEntries, journalLines } from "@/db/schema";  // Ensure imported

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
  overrides?: Record<string, string>;
}): Promise<PostingResult> {
  const { companyId, documentType, totalAmount, vatAmount, overrides } = params;

  // Generate logic entries
  const result = await generateJournalEntries({
    companyId,
    documentType,
    totalAmount,
    vatAmount,
    description: params.description,
    overrides
  });

  if (!result.success || !result.entries) {
    return result;
  }

  // Insert into DB
  try {
     const [journal] = await db.insert(journalEntries).values({
        companyId,
        journalNumber: `JV-${params.documentNumber}`,
        journalDate: params.postingDate,
        sourceDocType: documentType,
        sourceDocId: params.documentId,
        sourceDocNumber: params.documentNumber,
        description: params.description || `Auto-posting for ${documentType} ${params.documentNumber}`,
        totalDebit: totalAmount.toString(),
        totalCredit: totalAmount.toString(),
        status: "posted",
        postedAt: new Date(),
        postedBy: params.createdBy ? params.createdBy : undefined, // Check type if uuid
        createdBy: params.createdBy ? params.createdBy : undefined
     }).returning();

     // Insert Lines
     await db.insert(journalLines).values(
        result.entries.map((entry, idx) => ({
            companyId,
            journalId: journal.id,
            lineNumber: idx + 1,
            accountId: entry.accountId,
            description: entry.accountName, // Or params.description
            debit: entry.debit.toString(),
            credit: entry.credit.toString()
        }))
     );

     return { success: true, entries: result.entries };

  } catch (dbError: any) {
      console.error("DB Posting Error:", dbError);
      return { success: false, error: dbError.message };
  }
}

/**
 * Reverse a GL posting
 */
export async function reverseGLPosting(params: {
  companyId: string;
  originalDocumentId: string;
  reversalDate: Date;
  reason: string;
  createdBy?: string;
}): Promise<PostingResult> {
  // TODO: Implement Reversal Logic
  return { success: true, entries: [] };
}
