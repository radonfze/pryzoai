import { db } from "@/db";
import { stockTransactions } from "@/db/schema";
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
import { ClipboardList } from "lucide-react";
import GradientHeader from "@/components/ui/gradient-header";

const DEMO_COMPANY_ID = "00000000-0000-0000-0000-000000000000";

export default async function StockLedgerPage() {
  const transactions = await db.query.stockTransactions.findMany({
    where: eq(stockTransactions.companyId, DEMO_COMPANY_ID),
    with: {
        item: true,
        warehouse: true
    },
    orderBy: [desc(stockTransactions.transactionDate)],
    limit: 100
  });

  return (
    <div className="flex flex-col gap-6 p-4 pt-0">
      <GradientHeader
        module="inventory"
        title="Stock Ledger"
        description="Complete history of all inventory movements and transactions"
        icon={ClipboardList}
      />

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    No transactions found.
                  </TableCell>
                </TableRow>
            ) : (
                transactions.map((txn) => (
                    <TableRow key={txn.id}>
                        <TableCell className="text-xs">
                             {format(new Date(txn.transactionDate), "dd MMM yyyy HH:mm")}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                            {/* Schema uses documentNumber not referenceId */}
                            {txn.documentNumber || "-"}
                        </TableCell>
                        <TableCell className="font-medium">{txn.item.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{txn.warehouse.name}</TableCell>
                        <TableCell>
                            <Badge variant="outline" className="uppercase text-[10px]">
                                {txn.transactionType}
                            </Badge>
                        </TableCell>
                        <TableCell className={Number(txn.quantity) > 0 ? "text-right text-green-600 font-medium" : "text-right text-red-600 font-medium"}>
                            {Number(txn.quantity) > 0 ? "+" : ""}{Number(txn.quantity)}
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

export const dynamic = 'force-dynamic';