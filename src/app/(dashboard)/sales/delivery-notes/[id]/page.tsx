import { db } from "@/db";
import { deliveryNotes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import GradientHeader from "@/components/ui/gradient-header";
import { Package, Printer, ArrowLeft, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = 'force-dynamic';

export default async function DeliveryNoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const deliveryNote = await db.query.deliveryNotes.findFirst({
    where: eq(deliveryNotes.id, id),
    with: {
      customer: true,
      warehouse: true,
      lines: {
        with: {
          item: true
        }
      }
    }
  });

  if (!deliveryNote) notFound();

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between no-print">
         <GradientHeader
            module="sales"
            title={`Delivery Note: ${deliveryNote.deliveryNoteNumber}`}
            description={`Customer: ${deliveryNote.customer?.name || "N/A"}`}
            icon={Package}
          />
        <div className="flex gap-2">
            <Link href="/sales/delivery-notes">
                <Button variant="ghost"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
            </Link>
             <Link href={`/sales/delivery-notes/${deliveryNote.id}/print`}>
                <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
             </Link>
             {deliveryNote.status !== 'delivered' && (
                <form action={async () => {
                   "use server";
                   // Simple server action for now - ideally separate file
                   await db.update(deliveryNotes).set({ status: 'delivered', updatedAt: new Date() }).where(eq(deliveryNotes.id, id));
                }}>
                    <Button type="submit"><CheckCircle className="mr-2 h-4 w-4" /> Mark as Delivered</Button>
                </form>
             )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-lg">Delivery Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Delivery Note #</span><span className="font-medium">{deliveryNote.deliveryNoteNumber}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{format(new Date(deliveryNote.deliveryDate), "dd MMM yyyy")}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Warehouse</span><span>{deliveryNote.warehouse?.name || "-"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant="outline">{deliveryNote.status}</Badge></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Customer & Shipping</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="font-medium">{deliveryNote.customer?.name}</div>
            <div className="text-muted-foreground">{deliveryNote.customer?.email}</div>
            <div className="text-muted-foreground">{deliveryNote.customer?.phone}</div>
            <div className="text-muted-foreground mt-2 border-t pt-2">
                <span className="font-semibold">Shipping Address:</span><br/>
                {deliveryNote.shippingAddress || "Same as billing address"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Logistics</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
             <div className="flex justify-between"><span className="text-muted-foreground">Driver</span><span>{deliveryNote.driverName || "-"}</span></div>
             <div className="flex justify-between"><span className="text-muted-foreground">Vehicle</span><span>{deliveryNote.vehicleNumber || "-"}</span></div>
             <div className="flex justify-between"><span className="text-muted-foreground">Received By</span><span>{deliveryNote.receivedBy || "-"}</span></div>
          </CardContent>
        </Card>
      </div>

       <Card>
          <CardHeader><CardTitle>Items</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>UOM</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveryNote.lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>{line.item?.code}</TableCell>
                    <TableCell>
                        <div className="flex flex-col">
                            <span>{line.item?.name}</span>
                            <span className="text-xs text-muted-foreground">{line.description}</span>
                        </div>
                    </TableCell>
                    <TableCell className="text-right">{line.quantity}</TableCell>
                    <TableCell>{line.uom}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
    </div>
  );
}
