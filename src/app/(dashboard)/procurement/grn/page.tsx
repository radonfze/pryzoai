import { db } from "@/db";
import { goodsReceipts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, Eye } from "lucide-react";
import { format } from "date-fns";

export const dynamic = 'force-dynamic';

export default async function GRNPage() {
  const companyId = "00000000-0000-0000-0000-000000000000";

  let grnList: any[] = [];
  try {
    grnList = await db.query.goodsReceipts.findMany({
      where: eq(goodsReceipts.companyId, companyId),
      orderBy: [desc(goodsReceipts.createdAt)],
      with: {
        supplier: true,
        purchaseOrder: true,
      },
      limit: 50,
    });
  } catch {
    // Table might not exist
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Goods Receipt Notes</h2>
        <Link href="/procurement/grn/new">
          <Button><Plus className="mr-2 h-4 w-4" /> New GRN</Button>
        </Link>
      </div>

      {grnList.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No goods receipts yet.</p>
          <p className="text-sm mt-2">Record goods received from purchase orders.</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>GRN #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>PO Reference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grnList.map((grn) => (
                <TableRow key={grn.id}>
                  <TableCell className="font-medium">{grn.grnNumber || grn.id.slice(0, 8)}</TableCell>
                  <TableCell>{grn.receiptDate ? format(new Date(grn.receiptDate), "dd/MM/yyyy") : "-"}</TableCell>
                  <TableCell>{grn.supplier?.name || "-"}</TableCell>
                  <TableCell>{grn.purchaseOrder?.orderNumber || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={grn.status === "posted" ? "default" : "outline"}>
                      {grn.status || "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`/procurement/grn/${grn.id}`}>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
