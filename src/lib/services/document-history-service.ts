"use server";

import { db } from "@/db";
import { documentHistory } from "@/db/schema";
import { getSession } from "@/lib/auth";

export type DocumentAction = 
  | "CREATE" 
  | "UPDATE" 
  | "STATUS_CHANGE" 
  | "EMAIL_SENT" 
  | "PRINTED" 
  | "POSTED" 
  | "CANCELLED" 
  | "REVERSED"
  | "PAYMENT_RECEIVED";

export interface DocumentHistoryEntry {
  documentId: string;
  documentType: "quotation" | "invoice" | "order" | "return" | "credit_note" | "payment";
  documentNumber?: string;
  action: DocumentAction;
  previousValue?: Record<string, any>;
  newValue?: Record<string, any>;
  changes?: Record<string, any>;
}

/**
 * Log a document action to the history table
 * Called automatically by document create/update actions
 */
export async function logDocumentAction(
  entry: DocumentHistoryEntry,
  userId?: string
): Promise<void> {
  try {
    const session = await getSession();
    const companyId = session?.companyId;
    const performedBy = userId || session?.userId;

    if (!companyId) {
      console.warn("logDocumentAction: No company ID available");
      return;
    }

    await db.insert(documentHistory).values({
      companyId,
      documentId: entry.documentId,
      documentType: entry.documentType,
      documentNumber: entry.documentNumber,
      action: entry.action,
      previousValue: entry.previousValue,
      newValue: entry.newValue,
      changes: entry.changes,
      performedBy,
      // Note: ipAddress and userAgent would need to be passed from request context
    });
  } catch (error) {
    // Don't fail the main operation if history logging fails
    console.error("Failed to log document history:", error);
  }
}

/**
 * Get history for a specific document
 */
export async function getDocumentHistory(documentId: string) {
  const session = await getSession();
  if (!session?.companyId) return [];

  return db.query.documentHistory.findMany({
    where: (history, { and, eq }) => 
      and(
        eq(history.companyId, session.companyId!),
        eq(history.documentId, documentId)
      ),
    orderBy: (history, { desc }) => [desc(history.createdAt)],
    with: {
      performer: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });
}
