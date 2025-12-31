"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createGLPosting, GLLine } from "@/lib/services/gl-posting-service";
import { getCompanyId, requirePermission } from "@/lib/auth";
import { journalEntries, journalLines } from "@/db/schema"; // Still needed for Drafts
import { generateNextNumber } from "@/lib/services/number-generator";
import { eq } from "drizzle-orm";

const createJournalSchema = z.object({
  entryDate: z.string(),
  description: z.string().min(3),
  reference: z.string().optional(),
  status: z.enum(["draft", "posted"]).default("draft"),
  lines: z.array(z.object({
    accountId: z.string().uuid(),
    debit: z.coerce.number().min(0),
    credit: z.coerce.number().min(0),
    description: z.string().optional(),
    partyId: z.string().uuid().optional().or(z.literal("")),
    partyType: z.string().optional(),
  })).min(2).refine(lines => {
    const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0);
    const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0);
    return Math.abs(totalDebit - totalCredit) < 0.01;
  }, { message: "Debits must equal Credits" }),
});

export async function createManualJournal(data: z.infer<typeof createJournalSchema>) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return { success: false, error: "Unauthorized" };

    // Permission Check
    try { await requirePermission("finance.journals.create"); }
    catch (e) { return { success: false, error: "Forbidden: Missing permissions" }; }


    const result = createJournalSchema.safeParse(data);
    if (!result.success) {
      return { success: false, error: result.error.flatten() };
    }

    const { entryDate, description, reference, lines, status } = result.data;

    return await db.transaction(async (tx) => {
        // If Status is POSTED, use GL Service (which validates period, locks, etc.)
        if (status === "posted") {
            const glLines: GLLine[] = lines.map(l => ({
                accountId: l.accountId,
                debit: l.debit,
                credit: l.credit,
                description: l.description || description
            }));

            const postResult = await createGLPosting({
                sourceType: 'manual',
                sourceId: crypto.randomUUID(), // Manual entries are their own source
                sourceNumber: reference || "MANUAL",
                postingDate: new Date(entryDate),
                description: description,
                lines: glLines,
                tx
            });

            if (!postResult.success) {
                throw new Error(postResult.error);
            }
            return { success: true, id: postResult.journalId };
        } 
        
        // If Status is DRAFT, insert directly (Bypassing strict GL checks like period locking for now)
        else {
             const journalNumber = await generateNextNumber(companyId, "JV", "journal_entries");
             const totalAmount = lines.reduce((sum, l) => sum + l.debit, 0);

             const [jv] = await tx.insert(journalEntries).values({
                  companyId,
                  journalNumber,
                  journalDate: entryDate,
                  description,
                  sourceDocNumber: reference,
                  sourceType: "manual",
                  totalDebit: totalAmount.toString(),
                  totalCredit: totalAmount.toString(),
                  status: "draft",
              }).returning();

              await tx.insert(journalLines).values(
                  lines.map((line, index) => ({
                      companyId,
                      journalId: jv.id,
                      lineNumber: index + 1,
                      accountId: line.accountId,
                      debitAmount: line.debit.toString(),
                      creditAmount: line.credit.toString(),
                      description: line.description || description,
                  }))
              );
              
              return { success: true, id: jv.id };
        }
    });

  } catch (error: any) {
    console.error("Create Journal Error:", error);
    return { success: false, message: error.message };
  }
}
