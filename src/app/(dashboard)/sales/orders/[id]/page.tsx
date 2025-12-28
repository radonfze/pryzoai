import { db } from "@/db";
import { salesOrders } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Printer, Edit, ShoppingCart } from "lucide-react";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import GradientHeader from "@/components/ui/gradient-header";

export const dynamic = 'force-dynamic';

export default async function SalesOrderDetailPage({ params }: { params: { id: string } }) {
  const order = await db.query.salesOrders.findFirst({
    where: eq(salesOrders.id, params.id),
    with: {
      customer: true,
      lines: {
          with: {
              item: true
          }
      },
    },
  });

  if (!order) {
    notFound();
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between no-print">
         <GradientHeader
            module="sales"
            title={`Sales Order: ${order.orderNumber}`}
            description="View order details and status"
            icon={ShoppingCart}
          />
        <div className="flex gap-2">
            <Link href="/sales/orders">
                <Button variant="ghost"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
            </Link>
            <Link href={`/sales/orders/${order.id}/edit`}>
                 <Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Edit</Button>
            </Link>
             <Link href={`/sales/orders/${order.id}/print`}>
                <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
             </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Details */}
        <Card className="md:col-span-2">
           <CardHeader><CardTitle>Order Information</CardTitle></CardHeader>
           <CardContent className="grid gap-4 md:grid-cols-2">
               <div>
                   <label className="text-sm font-medium text-muted-foreground">Customer</label>
                   <p className="text-lg font-medium">{order.customer?.name}</p>
                   <p className="text-sm text-muted-foreground">{order.customer?.email}</p>
               </div>
               <div>
                   <label className="text-sm font-medium text-muted-foreground">Order Date</label>
                   <p className="text-lg">{format(new Date(order.orderDate), "dd MMM yyyy")}</p>
               </div>
               <div>
                   <label className="text-sm font-medium text-muted-foreground">Status</label>
                   <div className="mt-1">
                       <Badge variant={order.status === 'issued' ? 'default' : 'secondary'}>
                           {order.status || 'Draft'}
                       </Badge>
                   </div>
               </div>
               <div>
                   <label className="text-sm font-medium text-muted-foreground">Reference</label>
                   <p>{order.reference || "-"}</p>
               </div>
           </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card>
            <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>AED {Number(order.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <span>- AED {Number(order.discountAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">VAT</span>
                    <span>AED {Number(order.taxAmount || 0).toFixed(2)}</span>
                </div>
                <div className="border-t pt-4 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>AED {Number(order.totalAmount || 0).toFixed(2)}</span>
                </div>
            </CardContent>
        </Card>
      </div>

      <Card>
          <CardHeader><CardTitle>Line Items</CardTitle></CardHeader>
          <CardContent>
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Unit Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {order.lines.map((line: any) => (
                          <TableRow key={line.id}>
                              <TableCell className="font-medium">
                                  {line.item?.name || line.description}
                                  {line.description && <div className="text-xs text-muted-foreground">{line.description}</div>}
                              </TableCell>
                              <TableCell className="text-right">{line.quantity} {line.uom}</TableCell>
                              <TableCell className="text-right">{Number(line.unitPrice).toFixed(2)}</TableCell>
                              <TableCell className="text-right">{Number(line.lineTotal).toFixed(2)}</TableCell>
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
          </CardContent>
      </Card>
    </div>
  );
}
