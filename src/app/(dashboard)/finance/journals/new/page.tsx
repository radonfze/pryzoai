import { db } from "@/db";
import { chartOfAccounts } from "@/db/schema";
import { eq, and, isNotNull } from "drizzle-orm";
import JournalEntryForm from "@/components/finance/journal-form";

// Force dynamic rendering - this page queries DB
export const dynamic = 'force-dynamic';

export default async function NewJournalPage() {
  const companyId = "00000000-0000-0000-0000-000000000000";

  // Fetch Transactable Accounts (Not Groups - schema doesn't have isGroup, use parentId to identify leaf accounts)
  // We fetch all accounts and filter by those that allow manual entry
  const accounts = await db.query.chartOfAccounts.findMany({
    where: and(
      eq(chartOfAccounts.companyId, companyId), 
      eq(chartOfAccounts.allowManualEntry, true),
      eq(chartOfAccounts.isActive, true)
    )
  });

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
       <JournalEntryForm accounts={accounts} />
    </div>
  );
}
