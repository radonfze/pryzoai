import { db } from "@/db";
import { chartOfAccounts } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const DEMO_COMPANY_ID = "00000000-0000-0000-0000-000000000000";

export default async function ChartOfAccountsPage() {
  const accounts = await db.query.chartOfAccounts.findMany({
    where: eq(chartOfAccounts.companyId, DEMO_COMPANY_ID),
    orderBy: [asc(chartOfAccounts.code)]
  });

  return (
    <div className="flex flex-col gap-4 p-4 pt-0">
       <div className="flex items-center justify-between space-y-2">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Chart of Accounts</h2>
            <p className="text-muted-foreground">Manage your General Ledger structure.</p>
        </div>
      </div>

      <div className="rounded-md border bg-white">
         <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[100px]">Code</TableHead>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Parent</TableHead>
                    <TableHead>Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {accounts.length === 0 ? (
                     <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No accounts found. Run seed script.
                        </TableCell>
                    </TableRow>
                ) : (
                    accounts.map(acc => (
                        <TableRow key={acc.id}>
                            <TableCell className="font-mono font-medium">{acc.code}</TableCell>
                            <TableCell>
                                <span className={acc.isGroup ? "font-bold" : "pl-4"}>
                                    {acc.name}
                                </span>
                            </TableCell>
                            <TableCell className="capitalize">{acc.accountType}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{acc.parentAccountId || "-"}</TableCell>
                             <TableCell>
                                <Badge variant={acc.isActive ? "default" : "secondary"}>
                                    {acc.isActive ? "Active" : "Inactive"}
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
