import { db } from "@/db";
import { salesReturns, customers, salesInvoices, salesLines, items } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import GradientHeader from "@/components/ui/gradient-header";
import { Undo2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = 'force-dynamic';

export default async function SalesReturnDetailPage({ params }: { params: { id: string } }) {
  const returnDoc = await db.query.salesReturns.findFirst({
    where: eq(salesReturns.id, params.id),
    with: {
      customer: true,
      invoice: true,
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
        module="sales"
        title={`Sales Return: ${returnDoc.returnNumber}`}
        description={`Customer: ${returnDoc.customer?.name || "N/A"}`}
        icon={Undo2}
      />

      <div className="flex justify-end gap-2">
        <Button variant="outline">Generate Credit Note</Button>
        <Button>Post Return</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-lg">Return Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Return Number</span><span className="font-medium">{returnDoc.returnNumber}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{format(new Date(returnDoc.returnDate), "dd MMM yyyy")}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Original Invoice</span><span>{returnDoc.invoice?.invoiceNumber || "-"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant="outline">{returnDoc.status}</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Reason</span><span>{returnDoc.reason || "-"}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Customer</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="font-medium">{returnDoc.customer?.name}</div>
            <div className="text-muted-foreground">{returnDoc.customer?.email}</div>
            <div className="text-muted-foreground">{returnDoc.customer?.phone}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Amount</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{Number(returnDoc.totalAmount).toLocaleString()} AED</div>
            <div className="text-sm text-muted-foreground mt-2">Credit to Customer</div>
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
