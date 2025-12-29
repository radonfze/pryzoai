
import { db } from "@/db";
import { chartOfAccounts, journalEntries, journalLines } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import JournalEntryForm from "@/components/finance/journal-form";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function EditJournalPage({ params }: { params: { id: string } }) {
  const companyId = "00000000-0000-0000-0000-000000000000";

  // Fetch Journal
  const journal = await db.query.journalEntries.findFirst({
      where: eq(journalEntries.id, params.id),
      with: {
          lines: true
      }
  });

  if (!journal) return notFound();

  // Fetch Accounts
  const accounts = await db.query.chartOfAccounts.findMany({
    where: and(
      eq(chartOfAccounts.companyId, companyId), 
      eq(chartOfAccounts.allowManualEntry, true),
      eq(chartOfAccounts.isActive, true)
    )
  });

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
       <JournalEntryForm accounts={accounts} initialData={journal} isEdit={true} />
    </div>
  );
}
