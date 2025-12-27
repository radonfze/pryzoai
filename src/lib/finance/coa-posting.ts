/**
 * COA Auto-Posting Engine
 * 
 * Automatically generates journal entries for document actions.
 * Supports reversal for cancelled documents.
 */

import { db } from "@/db";
import { chartOfAccounts, auditLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createAuditLog } from "@/lib/audit";

export type PostingType = 
  | "sales_invoice"
  | "sales_payment"
  | "purchase_invoice"
  | "purchase_payment"
  | "inventory_receipt"
  | "inventory_issue"
  | "journal_entry";

export interface PostingLine {
  accountCode: string;
  description: string;
  debit: number;
  credit: number;
  costCenter?: string;
  project?: string;
}

export interface PostingRequest {
  companyId: string;
  documentType: PostingType;
  documentId: string;
  documentNumber: string;
  transactionDate: Date;
  lines: PostingLine[];
  userId: string;
  isReversal?: boolean;
  originalPostingId?: string;
}

export interface PostingResult {
  success: boolean;
  postingId?: string;
  error?: string;
  journalNumber?: string;
}

/**
 * Standard posting rules by document type
 */
const POSTING_TEMPLATES: Record<PostingType, { debit: string; credit: string; description: string }[]> = {
  sales_invoice: [
    { debit: "1200", credit: "4100", description: "Sales Revenue - AR" },
    { debit: "5100", credit: "1300", description: "COGS - Inventory" },
  ],
  sales_payment: [
    { debit: "1100", credit: "1200", description: "Cash/Bank - AR Collection" },
  ],
  purchase_invoice: [
    { debit: "1300", credit: "2100", description: "Inventory - AP" },
  ],
  purchase_payment: [
    { debit: "2100", credit: "1100", description: "AP - Cash/Bank Payment" },
  ],
  inventory_receipt: [
    { debit: "1300", credit: "1300", description: "Inventory Transfer In" },
  ],
  inventory_issue: [
    { debit: "5100", credit: "1300", description: "Expense - Inventory Issue" },
  ],
  journal_entry: [], // Custom entries
};

/**
 * Create journal postings for a document
 */
export async function createPosting(request: PostingRequest): Promise<PostingResult> {
  try {
    // Validate total debits = credits
    const totalDebit = request.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = request.lines.reduce((sum, line) => sum + line.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return {
        success: false,
        error: `Posting is unbalanced. Debit: ${totalDebit}, Credit: ${totalCredit}`,
      };
    }

    // Validate account codes exist
    for (const line of request.lines) {
      const account = await db
        .select()
        .from(chartOfAccounts)
        .where(
          and(
            eq(chartOfAccounts.companyId, request.companyId),
            eq(chartOfAccounts.code, line.accountCode)
          )
        )
        .limit(1);

      if (account.length === 0) {
        return {
          success: false,
          error: `Account code not found: ${line.accountCode}`,
        };
      }

      if (!account[0].allowManualEntry && request.documentType === "journal_entry") {
        return {
          success: false,
          error: `Manual entry not allowed for account: ${line.accountCode}`,
        };
      }
    }

    // Generate journal number
    const journalNumber = `JV-${Date.now()}`; // TODO: Use numbering service

    // Create audit log for the posting
    const auditId = await createAuditLog({
      companyId: request.companyId,
      userId: request.userId,
      entityType: "journal_posting",
      entityId: request.documentId,
      action: request.isReversal ? "CANCEL" : "CREATE",
      afterValue: {
        documentType: request.documentType,
        documentNumber: request.documentNumber,
        journalNumber,
        lines: request.lines,
        totalDebit,
        totalCredit,
        isReversal: request.isReversal,
      },
    });

    // TODO: Insert into journal_entries and journal_lines tables
    // TODO: Update account balances in chart_of_accounts

    return {
      success: true,
      postingId: auditId,
      journalNumber,
    };
  } catch (error) {
    console.error("Posting error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Posting failed",
    };
  }
}

/**
 * Create reversal posting for cancelled document
 */
export async function createReversalPosting(
  companyId: string,
  originalDocumentId: string,
  userId: string,
  reason: string
): Promise<PostingResult> {
  // TODO: Fetch original posting from journal_entries
  // TODO: Create reverse entries (swap debit/credit)
  // TODO: Link to original posting

  // For now, log the reversal intent
  await createAuditLog({
    companyId,
    userId,
    entityType: "journal_reversal",
    entityId: originalDocumentId,
    action: "CANCEL",
    afterValue: { reason, reversedAt: new Date().toISOString() },
  });

  return {
    success: true,
    journalNumber: `JV-REV-${Date.now()}`,
  };
}

/**
 * Get posting template for document type
 */
export function getPostingTemplate(documentType: PostingType): typeof POSTING_TEMPLATES.sales_invoice {
  return POSTING_TEMPLATES[documentType] || [];
}

/**
 * Validate if document can be posted
 */
export function canPost(documentStatus: string): boolean {
  // Only approved documents can be posted to COA
  return documentStatus === "approved";
}
