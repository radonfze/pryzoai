import { db } from "@/db";
import { supplierPayments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, DollarSign } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import GradientHeader from "@/components/ui/gradient-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = 'force-dynamic';

export default async function ViewPaymentPage({ params }: { params: { id: string } }) {
  const payment = await db.query.supplierPayments.findFirst({
    where: eq(supplierPayments.id, params.id),
    with: {
      supplier: true,
      allocations: {
        with: {
          invoice: true,
        },
      },
    },
  });

  if (!payment) {
    notFound();
  }

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800",
    posted: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/procurement/payments">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{payment.paymentNumber}</h1>
            <p className="text-sm text-muted-foreground">Supplier Payment</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/procurement/payments/${payment.id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Payment Number</p>
                <p className="text-base font-medium">{payment.paymentNumber}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusColors[payment.status]}`}>
                  {payment.status.toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Payment Date</p>
                <p className="text-base">{format(new Date(payment.paymentDate), "MMM dd, yyyy")}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
                <p className="text-base capitalize">{payment.paymentMethod}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bank</p>
                <p className="text-base">{payment.bankName || "—"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cheque #</p>
                <p className="text-base">{payment.chequeNumber || "—"}</p>
              </div>
            </div>
            {payment.notes && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Notes</p>
                <p className="text-sm text-muted-foreground">{payment.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Amounts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm text-muted-foreground">Total Payment</span>
              <span className="text-lg font-bold">{Number(payment.amount).toLocaleString()} AED</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Allocated</span>
              <span className="text-sm font-medium text-green-600">
                {Number(payment.allocatedAmount || 0).toLocaleString()} AED
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Unallocated</span>
              <span className="text-sm font-medium text-orange-600">
                {Number(payment.unallocatedAmount || 0).toLocaleString()} AED
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Supplier Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <p className="font-medium text-lg">{payment.supplier?.name}</p>
            {payment.supplier?.email && (
              <p className="text-sm text-muted-foreground">{payment.supplier.email}</p>
            )}
            {payment.supplier?.phone && (
              <p className="text-sm text-muted-foreground">{payment.supplier.phone}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {payment.allocations && payment.allocations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Allocations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice Number</TableHead>
                    <TableHead>Invoice Date</TableHead>
                    <TableHead className="text-right">Invoice Total</TableHead>
                    <TableHead className="text-right">Allocated Amount</TableHead>
                    <TableHead>Allocation Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payment.allocations.map((allocation: any) => (
                    <TableRow key={allocation.id}>
                      <TableCell className="font-medium">
                        <Link 
                          href={`/procurement/bills/${allocation.invoiceId}`}
                          className="text-primary hover:underline"
                        >
                          {allocation.invoice?.invoiceNumber || allocation.invoiceId}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {allocation.invoice?.invoiceDate 
                          ? format(new Date(allocation.invoice.invoiceDate), "MMM dd, yyyy")
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {allocation.invoice?.totalAmount 
                          ? `${Number(allocation.invoice.totalAmount).toLocaleString()} AED`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {Number(allocation.allocatedAmount).toLocaleString()} AED
                      </TableCell>
                      <TableCell>
                        {format(new Date(allocation.allocationDate), "MMM dd, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
