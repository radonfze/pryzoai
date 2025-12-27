import { db } from "@/db";
import { journalEntries } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const DEMO_COMPANY_ID = "00000000-0000-0000-0000-000000000000";

export default async function JournalEntriesPage() {
  const journals = await db.query.journalEntries.findMany({
    where: eq(journalEntries.companyId, DEMO_COMPANY_ID),
    limit: 50,
    // Schema uses journalDate not entryDate
    orderBy: [desc(journalEntries.journalDate)]
  });

  return (
    <div className="flex flex-col gap-4 p-4 pt-0">
      <div className="flex items-center justify-between">
         <div>
            <h2 className="text-3xl font-bold tracking-tight">Journal Entries</h2>
            <p className="text-muted-foreground">General Ledger transaction history.</p>
         </div>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Voucher No</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead className="text-right">Total Debit</TableHead>
              <TableHead className="text-right">Total Credit</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {journals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                    No journal entries found.
                  </TableCell>
                </TableRow>
            ) : (
                journals.map((jv) => (
                    <TableRow key={jv.id}>
                        <TableCell className="text-xs">
                             {/* Schema uses journalDate not entryDate */}
                             {format(new Date(jv.journalDate), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold">
                            {/* Schema uses journalNumber not entryNumber */}
                            {jv.journalNumber}
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate">{jv.description}</TableCell>
                        {/* Schema uses sourceDocNumber not referenceId */}
                        <TableCell className="text-xs text-muted-foreground">{jv.sourceDocNumber || "-"}</TableCell>
                         <TableCell className="text-right font-mono text-xs">
                            {Number(jv.totalDebit).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                            {Number(jv.totalCredit).toFixed(2)}
                        </TableCell>
                         <TableCell>
                            <Badge variant="outline" className="uppercase text-[10px]">
                                {jv.status}
                            </Badge>
                        </TableCell>
                    </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
