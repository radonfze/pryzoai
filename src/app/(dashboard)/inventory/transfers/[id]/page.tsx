import { db } from "@/db";
import { stockTransfers } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, ArrowRightLeft, Printer } from "lucide-react";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import GradientHeader from "@/components/ui/gradient-header";

export const dynamic = 'force-dynamic';

export default async function StockTransferDetailPage({ params }: { params: { id: string } }) {
  const transfer = await db.query.stockTransfers.findFirst({
    where: eq(stockTransfers.id, params.id),
    with: {
        fromWarehouse: true,
        toWarehouse: true,
        lines: {
            with: {
                item: true
            }
        },
    },
  });

  if (!transfer) {
    notFound();
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between no-print">
         <GradientHeader
            module="inventory"
            title={`Transfer: ${transfer.transferNumber}`}
            description="View stock movement details"
            icon={ArrowRightLeft}
          />
        <div className="flex gap-2">
            <Link href="/inventory/transfers">
                <Button variant="ghost"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
            </Link>
            <Link href={`/inventory/transfers/${transfer.id}/edit`}>
                 <Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Edit</Button>
            </Link>
             <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Print</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Details */}
        <Card className="md:col-span-2">
           <CardHeader><CardTitle>Transfer Information</CardTitle></CardHeader>
           <CardContent className="grid gap-4 md:grid-cols-2">
               <div>
                   <label className="text-sm font-medium text-muted-foreground">Source Warehouse</label>
                   <p className="text-lg font-medium">{transfer.fromWarehouse?.name}</p>
               </div>
               <div>
                   <label className="text-sm font-medium text-muted-foreground">Destination Warehouse</label>
                   <p className="text-lg font-medium">{transfer.toWarehouse?.name}</p>
               </div>
               <div>
                   <label className="text-sm font-medium text-muted-foreground">Date</label>
                   <p className="text-lg">{format(new Date(transfer.transferDate), "dd MMM yyyy")}</p>
               </div>
               <div>
                   <label className="text-sm font-medium text-muted-foreground">Status</label>
                   <div className="mt-1">
                       <Badge variant={transfer.status === 'completed' ? 'default' : 'secondary'}>
                           {transfer.status || 'Draft'}
                       </Badge>
                   </div>
               </div>
               <div className="md:col-span-2">
                   <label className="text-sm font-medium text-muted-foreground">Notes</label>
                   <p>{transfer.notes || "-"}</p>
               </div>
           </CardContent>
        </Card>

        {/* Audit */}
        <Card>
            <CardHeader><CardTitle>Audit</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Created At</span>
                    <span>{format(new Date(transfer.createdAt), "dd MMM yyyy")}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">Reference</span>
                    <span>{transfer.reference || "-"}</span>
                </div>
            </CardContent>
        </Card>
      </div>

      <Card>
          <CardHeader><CardTitle>Items</CardTitle></CardHeader>
          <CardContent>
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">UOM</TableHead>
                          <TableHead>Notes</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {transfer.lines.map((line: any) => (
                          <TableRow key={line.id}>
                              <TableCell className="font-medium">
                                  {line.item?.name}
                                  <div className="text-xs text-muted-foreground">{line.item?.code}</div>
                              </TableCell>
                              <TableCell className="text-right font-bold">{Number(line.quantity).toFixed(0)}</TableCell>
                              <TableCell className="text-right">{line.uom}</TableCell>
                              <TableCell className="text-muted-foreground text-sm">{line.notes || "-"}</TableCell>
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
          </CardContent>
      </Card>
    </div>
  );
}
