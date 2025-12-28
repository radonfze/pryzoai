import { db } from "@/db";
import { goodsReceipts } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Printer, Edit, PackageCheck } from "lucide-react";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import GradientHeader from "@/components/ui/gradient-header";

export const dynamic = 'force-dynamic';

export default async function GRNDetailPage({ params }: { params: { id: string } }) {
  const grn = await db.query.goodsReceipts.findFirst({
    where: eq(goodsReceipts.id, params.id),
    with: {
      supplier: true,
      purchaseOrder: true,
      lines: {
          with: {
              item: true
          }
      },
    },
  });

  if (!grn) {
    notFound();
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between no-print">
         <GradientHeader
            module="procurement"
            title={`GRN: ${grn.grnNumber}`}
            description="View goods receipt details"
            icon={PackageCheck}
          />
        <div className="flex gap-2">
            <Link href="/procurement/grn">
                <Button variant="ghost"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
            </Link>
            <Link href={`/procurement/grn/${grn.id}/edit`}>
                 <Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Edit</Button>
            </Link>
             <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Print</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Details */}
        <Card className="md:col-span-2">
           <CardHeader><CardTitle>Receipt Information</CardTitle></CardHeader>
           <CardContent className="grid gap-4 md:grid-cols-2">
               <div>
                   <label className="text-sm font-medium text-muted-foreground">Supplier</label>
                   <p className="text-lg font-medium">{grn.supplier?.name}</p>
                   <p className="text-sm text-muted-foreground">{grn.supplier?.email}</p>
               </div>
               <div>
                   <label className="text-sm font-medium text-muted-foreground">Receipt Date</label>
                   <p className="text-lg">{format(new Date(grn.grnDate), "dd MMM yyyy")}</p>
               </div>
               <div>
                   <label className="text-sm font-medium text-muted-foreground">Status</label>
                   <div className="mt-1">
                       <Badge variant={grn.status === 'posted' ? 'default' : 'outline'}>
                           {grn.status || 'Draft'}
                       </Badge>
                   </div>
               </div>
               <div>
                   <label className="text-sm font-medium text-muted-foreground">PO Reference</label>
                   <p>{grn.purchaseOrder?.orderNumber || "Direct GRN"}</p>
               </div>
           </CardContent>
        </Card>

        {/* Summary */}
        <Card>
            <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Supplier Doc #</span>
                    <span>{grn.supplierDocNumber || "-"}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Qty</span>
                    <span>{Number(grn.totalQuantity || 0)}</span>
                </div>
                 <div className="border-t pt-4 flex justify-between font-bold text-lg">
                    <span>Total Value</span>
                    <span>AED {Number(grn.totalValue || 0).toFixed(2)}</span>
                </div>
            </CardContent>
        </Card>
      </div>

      <Card>
          <CardHeader><CardTitle>Received Items</CardTitle></CardHeader>
          <CardContent>
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-right">Ordered Qty</TableHead>
                          <TableHead className="text-right">Received Qty</TableHead>
                          <TableHead className="text-right">UOM</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {grn.lines.map((line: any) => (
                          <TableRow key={line.id}>
                              <TableCell className="font-medium">
                                  {line.item?.name || line.description}
                                  {line.description && <div className="text-xs text-muted-foreground">{line.description}</div>}
                              </TableCell>
                              <TableCell className="text-right">{Number(line.quantity).toFixed(0)}</TableCell>
                              <TableCell className="text-right font-bold">{Number(line.receivedQty || line.quantity).toFixed(0)}</TableCell>
                              <TableCell className="text-right">{line.uom}</TableCell>
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
          </CardContent>
      </Card>
    </div>
  );
}
