import { db } from "@/db";
import { chartOfAccounts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import JournalEntryForm from "@/components/finance/journal-form";

export default async function NewJournalPage() {
  const companyId = "00000000-0000-0000-0000-000000000000";

  // Fetch Transactable Accounts (Not Groups)
  const accounts = await db.query.chartOfAccounts.findMany({
    where: and(eq(chartOfAccounts.companyId, companyId), eq(chartOfAccounts.isGroup, false))
  });

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
       <JournalEntryForm accounts={accounts} />
    </div>
  );
}
