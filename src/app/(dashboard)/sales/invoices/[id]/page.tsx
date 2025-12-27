import { db } from "@/db";
import { salesInvoices } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer, Download, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function InvoiceViewPage({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;

  const invoice = await db.query.salesInvoices.findFirst({
    where: eq(salesInvoices.id, id),
    with: {
      customer: true,
      // Schema uses 'lines' relation for salesLines, not 'items'
      lines: {
        with: { item: true }
      }
    }
  });

  if (!invoice) notFound();

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            <Link href="/sales/invoices">
                <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
            </Link>
            <h2 className="text-3xl font-bold tracking-tight">{invoice.invoiceNumber}</h2>
            {/* Use valid status values - confirmed/completed are equivalent to "posted" */}
            <Badge variant={invoice.status === "confirmed" || invoice.status === "completed" ? "default" : "outline"}>
                {invoice.status}
            </Badge>
        </div>
        <div className="flex items-center gap-2">
            <a href={`/api/sales/invoices/${id}/pdf`} target="_blank" rel="noreferrer">
                <Button variant="outline">
                    <Printer className="mr-2 h-4 w-4" />
                    Print / PDF
                </Button>
            </a>
            <Button>
                <Download className="mr-2 h-4 w-4" />
                Email Invoice
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Invoice Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-muted-foreground">Customer</p>
                            <p className="font-medium">{invoice.customer.name}</p>
                            <p>{invoice.customer.address}</p>
                        </div>
                         <div className="text-right">
                            <p className="text-muted-foreground">Dates</p>
                            <p>Issued: {format(new Date(invoice.invoiceDate), "PPP")}</p>
                            <p>Due: {format(new Date(invoice.dueDate), "PPP")}</p>
                        </div>
                    </div>

                    <div className="mt-8">
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item</TableHead>
                                    <TableHead className="text-right">Qty</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {/* Use lines instead of items */}
                                {invoice.lines.map(line => (
                                    <TableRow key={line.id}>
                                        <TableCell>
                                            <span className="font-medium">{line.item?.name || line.description || 'N/A'}</span>
                                            {line.description && <p className="text-xs text-muted-foreground">{line.description}</p>}
                                        </TableCell>
                                        <TableCell className="text-right">{Number(line.quantity)}</TableCell>
                                        <TableCell className="text-right">{Number(line.unitPrice).toFixed(2)}</TableCell>
                                        {/* Schema uses lineTotal not totalAmount */}
                                        <TableCell className="text-right">{Number(line.lineTotal).toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="mt-4 flex justify-end">
                        <div className="w-1/2 space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal</span>
                                {/* Schema uses subtotal not subTotal */}
                                <span>{Number(invoice.subtotal).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Tax</span>
                                {/* Schema uses taxAmount not totalTax */}
                                <span>{Number(invoice.taxAmount).toFixed(2)}</span>
                            </div>
                             <div className="flex justify-between font-bold text-lg border-t pt-2">
                                <span>Total</span>
                                <span>{Number(invoice.totalAmount).toFixed(2)} {invoice.currencyId}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle>Payment Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-4">
                        <p className="text-muted-foreground mb-2">Balance Due</p>
                        <p className="text-3xl font-bold text-red-600">
                             {Number(invoice.balanceAmount).toFixed(2)}
                        </p>
                    </div>
                    <Button className="w-full">Record Payment</Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
