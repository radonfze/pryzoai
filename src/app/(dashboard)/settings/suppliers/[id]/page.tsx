import { db } from "@/db";
import { suppliers, purchaseOrders, purchaseInvoices } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import GradientHeader from "@/components/ui/gradient-header";
import { Truck, Mail, Phone, MapPin, FileText, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

export default async function SupplierDetailPage({ params }: { params: { id: string } }) {
  const supplier = await db.query.suppliers.findFirst({
    where: eq(suppliers.id, params.id),
  });

  if (!supplier) notFound();

  // Get recent POs
  const recentPOs = await db.query.purchaseOrders.findMany({
    where: eq(purchaseOrders.supplierId, params.id),
    orderBy: [desc(purchaseOrders.createdAt)],
    limit: 10
  });

  // Get recent bills
  const recentBills = await db.query.purchaseInvoices.findMany({
    where: eq(purchaseInvoices.supplierId, params.id),
    orderBy: [desc(purchaseInvoices.createdAt)],
    limit: 10
  });

  // Calculate totals
  const totalBilled = recentBills.reduce((sum, bill) => sum + Number(bill.totalAmount || 0), 0);
  const totalPaid = recentBills.reduce((sum, bill) => sum + Number(bill.paidAmount || 0), 0);
  const balance = totalBilled - totalPaid;

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="procurement"
        title={supplier.name}
        description={`Supplier Code: ${supplier.code}`}
        icon={Truck}
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {supplier.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{supplier.email}</span>
              </div>
            )}
            {supplier.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{supplier.phone}</span>
              </div>
            )}
            {supplier.address && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>{supplier.address}</span>
              </div>
            )}
            {supplier.vatNumber && (
              <div className="text-sm">
                <span className="text-muted-foreground">VAT:</span> {supplier.vatNumber}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Account Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Billed</span>
              <span className="font-medium">{totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2 })} AED</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Paid</span>
              <span className="font-medium text-green-600">{totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })} AED</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-medium">Payable</span>
              <span className={`font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} AED
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Account Status</span>
              <Badge variant={supplier.isActive ? "default" : "secondary"}>
                {supplier.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Terms</span>
              <span>{supplier.paymentTerms || "Net 30"} days</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Purchase Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" /> Recent Purchase Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentPOs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">No POs found</TableCell>
                </TableRow>
              ) : (
                recentPOs.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell className="font-medium">{po.poNumber}</TableCell>
                    <TableCell>{format(new Date(po.orderDate), "dd MMM yyyy")}</TableCell>
                    <TableCell><Badge variant="outline">{po.status}</Badge></TableCell>
                    <TableCell className="text-right">{Number(po.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Bills */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" /> Recent Bills
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentBills.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">No bills found</TableCell>
                </TableRow>
              ) : (
                recentBills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell className="font-medium">{bill.billNumber}</TableCell>
                    <TableCell>{format(new Date(bill.billDate), "dd MMM yyyy")}</TableCell>
                    <TableCell><Badge variant="outline">{bill.status}</Badge></TableCell>
                    <TableCell className="text-right">{Number(bill.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right">{Number(bill.balanceAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
