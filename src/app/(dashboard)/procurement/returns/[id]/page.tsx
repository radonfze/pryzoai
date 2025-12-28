import { db } from "@/db";
import { purchaseReturns, purchaseLines, suppliers, items } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import GradientHeader from "@/components/ui/gradient-header";
import { Undo2, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = 'force-dynamic';

export default async function PurchaseReturnDetailPage({ params }: { params: { id: string } }) {
  const returnDoc = await db.query.purchaseReturns.findFirst({
    where: eq(purchaseReturns.id, params.id),
    with: {
      supplier: true,
      lines: {
        with: {
          item: true
        }
      }
    }
  });

  if (!returnDoc) notFound();

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="procurement"
        title={`Return: ${returnDoc.returnNumber}`}
        description={`Supplier: ${returnDoc.supplier?.name || "N/A"}`}
        icon={Undo2}
      />

      <div className="flex justify-end gap-2">
        <Button>Post Return</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-lg">Return Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Return Number</span><span className="font-medium">{returnDoc.returnNumber}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Return Date</span><span>{format(new Date(returnDoc.returnDate), "dd MMM yyyy")}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant="outline">{returnDoc.status}</Badge></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Amounts</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between font-bold"><span>Total Return</span><span>{Number(returnDoc.totalAmount).toLocaleString()} AED</span></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Return Items</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(returnDoc.lines || []).map((line: any, idx: number) => (
                <TableRow key={line.id}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>{line.item?.name || line.itemId}</TableCell>
                  <TableCell className="text-right">{Number(line.quantity)}</TableCell>
                  <TableCell className="text-right">{Number(line.unitPrice).toLocaleString()}</TableCell>
                  <TableCell className="text-right">{Number(line.lineTotal).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
