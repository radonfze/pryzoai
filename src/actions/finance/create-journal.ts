"use server";

import { db } from "@/db";
import { journalEntries, journalLines, chartOfAccounts } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createJournalSchema = z.object({
  entryDate: z.string(),
  description: z.string().min(3),
  reference: z.string().optional(),
  lines: z.array(z.object({
    accountId: z.string().uuid(),
    debit: z.number().min(0),
    credit: z.number().min(0),
    description: z.string().optional(),
    partyId: z.string().uuid().optional().or(z.literal("")),
    partyType: z.string().optional(),
  })).min(2).refine(lines => {
    const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0);
    const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0);
    return Math.abs(totalDebit - totalCredit) < 0.01;
  }, { message: "Debits must equal Credits" }),
});

export async function createManualJournal(data: z.infer<typeof createJournalSchema>, companyId: string) {
  const result = createJournalSchema.safeParse(data);
  if (!result.success) {
      return { success: false, error: result.error.flatten() };
  }
  const { entryDate, description, reference, lines } = result.data;
  const totalAmount = lines.reduce((sum, l) => sum + l.debit, 0);

  // 1. Insert Header (field names match schema/finance.ts)
  const [jv] = await db.insert(journalEntries).values({
      companyId,
      journalNumber: `JV-${Date.now()}`, // Schema uses journalNumber
      journalDate: entryDate, // Schema uses journalDate (string)
      description,
      sourceDocNumber: reference,
      totalDebit: totalAmount.toString(),
      totalCredit: totalAmount.toString(),
      status: "posted", // Auto-post for MVP
  }).returning();

  // 2. Insert Lines (field names match schema/finance.ts)
  await db.insert(journalLines).values(
      lines.map((line, index) => ({
          companyId,
          journalId: jv.id, // Schema uses journalId
          lineNumber: index + 1, // Required by schema
          accountId: line.accountId,
          debit: line.debit.toString(),
          credit: line.credit.toString(),
          description: line.description || description,
      }))
  );

  revalidatePath("/finance/journals");
  return { success: true, id: jv.id };
}
