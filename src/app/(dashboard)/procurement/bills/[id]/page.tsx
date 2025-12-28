import { db } from "@/db";
import { purchaseInvoices, purchaseLines, suppliers, items } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import GradientHeader from "@/components/ui/gradient-header";
import { FileText, Edit } from "lucide-react";
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

export default async function PurchaseBillDetailPage({ params }: { params: { id: string } }) {
  const bill = await db.query.purchaseInvoices.findFirst({
    where: eq(purchaseInvoices.id, params.id),
    with: {
      supplier: true,
      lines: {
        with: {
          item: true
        }
      }
    }
  });

  if (!bill) notFound();

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="procurement"
        title={`Bill: ${bill.invoiceNumber}`}
        description={`Supplier: ${bill.supplier?.name || "N/A"}`}
        icon={FileText}
      />

      <div className="flex justify-end gap-2">
        <Link href={`/procurement/bills/${params.id}/edit`}>
          <Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Edit</Button>
        </Link>
        <Button>Post to GL</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-lg">Bill Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Bill Number</span><span className="font-medium">{bill.invoiceNumber}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Bill Date</span><span>{format(new Date(bill.invoiceDate), "dd MMM yyyy")}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Due Date</span><span>{format(new Date(bill.dueDate), "dd MMM yyyy")}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant="outline">{bill.status}</Badge></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Supplier</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="font-medium">{bill.supplier?.name}</div>
            <div className="text-muted-foreground">{bill.supplier?.email}</div>
            <div className="text-muted-foreground">{bill.supplier?.phone}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Amounts</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{Number(bill.subtotal).toLocaleString()} AED</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{Number(bill.taxAmount).toLocaleString()} AED</span></div>
            <div className="flex justify-between font-bold border-t pt-2"><span>Total</span><span>{Number(bill.totalAmount).toLocaleString()} AED</span></div>
            <div className="flex justify-between text-red-600"><span>Balance</span><span>{Number(bill.balanceAmount).toLocaleString()} AED</span></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Line Items</CardTitle></CardHeader>
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
              {(bill.lines || []).map((line: any, idx: number) => (
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
