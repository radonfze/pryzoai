import { db } from "@/db";
import { stockTransfers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowRightLeft, Eye } from "lucide-react";
import GradientHeader from "@/components/ui/gradient-header";
import { format } from "date-fns";

export const dynamic = 'force-dynamic';

export default async function StockTransfersPage() {
  const companyId = "00000000-0000-0000-0000-000000000000";

  let transfers: any[] = [];
  try {
    transfers = await db.query.stockTransfers.findMany({
      where: eq(stockTransfers.companyId, companyId),
      orderBy: [desc(stockTransfers.createdAt)],
      with: {
        fromWarehouse: true,
        toWarehouse: true,
      },
      limit: 50,
    });
  } catch (e) {
    console.error("Failed to fetch transfers", e);
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="inventory"
        title="Stock Transfers"
        description="Manage internal inventory movements between warehouses"
        icon={ArrowRightLeft}
      />
      
      <div className="flex items-center justify-end">
        <Link href="/inventory/transfers/new">
          <Button><Plus className="mr-2 h-4 w-4" /> New Transfer</Button>
        </Link>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transfer #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transfers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  No transfers found.
                </TableCell>
              </TableRow>
            ) : (
              transfers.map((st) => (
                <TableRow key={st.id}>
                  <TableCell className="font-medium font-mono">{st.transferNumber}</TableCell>
                  <TableCell>{st.transferDate ? format(new Date(st.transferDate), "dd MMM yyyy") : "-"}</TableCell>
                  <TableCell>{st.fromWarehouse?.name || "-"}</TableCell>
                  <TableCell>{st.toWarehouse?.name || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={st.status === "completed" ? "default" : "secondary"}>
                      {st.status || "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`/inventory/transfers/${st.id}`}>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
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
