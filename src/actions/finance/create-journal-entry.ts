"use server";

import { db } from "@/db";
import { 
  journalEntries,
  journalEntryLines,
  companies,
  accounts,
  numberSeries
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ActionResponse = {
  success: boolean;
  message: string;
  data?: any;
};

type JournalLine = {
  accountId: string;
  debit: number;
  credit: number;
  description?: string;
  costCenterId?: string;
};

type JournalInput = {
  entryDate: string;
  reference?: string;
  description?: string;
  lines: JournalLine[];
};

async function generateJournalNumber(companyId: string, entryDate: Date): Promise<string> {
  const series = await db.query.numberSeries.findFirst({
    where: and(
      eq(numberSeries.companyId, companyId),
      eq(numberSeries.documentType, "journal"),
      eq(numberSeries.isActive, true)
    ),
  });

  if (!series) return `JV-${Date.now()}`;

  const year = entryDate.getFullYear();
  let yearPart = "";
  
  if (series.yearFormat === "YYYY") yearPart = year.toString();
  else if (series.yearFormat === "YY") yearPart = year.toString().slice(-2);

  const nextNumber = series.currentValue;
  
  await db.update(numberSeries)
    .set({ currentValue: nextNumber + 1, updatedAt: new Date() })
    .where(eq(numberSeries.id, series.id));

  const paddedNumber = nextNumber.toString().padStart(5, "0");
  const parts = [series.prefix];
  if (yearPart) parts.push(yearPart);
  parts.push(paddedNumber);

  return parts.join(series.separator || "-");
}

import { getCompanyId } from "@/lib/auth";

export async function createJournalEntryAction(input: JournalInput): Promise<ActionResponse> {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return { success: false, message: "Unauthorized: No active company" };
    const DEMO_COMPANY_ID = companyId;

    // Validation
    if (!input.entryDate) return { success: false, message: "Entry date is required" };
    if (!input.lines || input.lines.length < 2) {
      return { success: false, message: "Journal entry must have at least 2 lines" };
    }

    // Calculate totals
    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of input.lines) {
      totalDebit += Number(line.debit || 0);
      totalCredit += Number(line.credit || 0);
    }

    // Validate balance
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return {
        success: false,
        message: `Journal entry is not balanced. Debit: ${totalDebit.toFixed(2)}, Credit: ${totalCredit.toFixed(2)}`,
      };
    }

    // Validate each line has either debit or credit
    for (const line of input.lines) {
      if (!Number(line.debit) && !Number(line.credit)) {
        return { success: false, message: "Each line must have either debit or credit amount" };
      }
      if (Number(line.debit) && Number(line.credit)) {
        return { success: false, message: "A line cannot have both debit and credit" };
      }
    }

    const entryDate = new Date(input.entryDate);
    const journalNumber = await generateJournalNumber(DEMO_COMPANY_ID, entryDate);

    const result = await db.transaction(async (tx) => {
      // Insert journal entry header
      const [journal] = await tx.insert(journalEntries).values({
        companyId: DEMO_COMPANY_ID,
        journalNumber,
        entryDate: input.entryDate,
        reference: input.reference,
        description: input.description,
        totalDebit: totalDebit.toFixed(2),
        totalCredit: totalCredit.toFixed(2),
        status: "draft",
        isPosted: false,
      }).returning();

      // Insert journal entry lines
      await tx.insert(journalEntryLines).values(
        input.lines.map((line, index) => ({
          companyId: DEMO_COMPANY_ID,
          journalEntryId: journal.id,
          lineNumber: index + 1,
          accountId: line.accountId,
          debit: Number(line.debit || 0).toFixed(2),
          credit: Number(line.credit || 0).toFixed(2),
          description: line.description || input.description,
          costCenterId: line.costCenterId,
        }))
      );

      return { journal };
    });

    revalidatePath("/finance/journals");

    return {
      success: true,
      message: `Journal Entry ${journalNumber} created successfully`,
      data: { id: result.journal.id, journalNumber },
    };
  } catch (error: any) {
    console.error("Create journal entry error:", error);
    return { success: false, message: error.message || "Failed to create journal entry" };
  }
}
