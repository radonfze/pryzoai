import { db } from "@/db";
import { salesInvoices, customers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import GradientHeader from "@/components/ui/gradient-header";
import { Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import Link from "next/link";

export const dynamic = 'force-dynamic';

// Delivery notes are typically linked to invoices or orders
export default async function DeliveryNoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // For now using invoice as delivery source
  const deliveryNote = await db.query.salesInvoices.findFirst({
    where: eq(salesInvoices.id, id),
    with: {
      customer: true,
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
      <GradientHeader
        module="sales"
        title={`Delivery Note: DN-${deliveryNote.invoiceNumber?.replace("INV-", "")}`}
        description={`Customer: ${deliveryNote.customer?.name || "N/A"}`}
        icon={Package}
      />

      <div className="flex justify-end gap-2">
        <Link href={`/sales/delivery-notes`}>
          <Button variant="outline">Back to List</Button>
        </Link>
        <Button variant="outline">Print</Button>
        <Button>Mark as Delivered</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-lg">Delivery Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Delivery Note #</span><span className="font-medium">DN-{deliveryNote.invoiceNumber?.replace("INV-", "")}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{format(new Date(deliveryNote.invoiceDate), "dd MMM yyyy")}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Invoice</span><span>{deliveryNote.invoiceNumber || "-"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant="outline">{deliveryNote.status}</Badge></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Customer</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="font-medium">{deliveryNote.customer?.name}</div>
            <div className="text-muted-foreground">{deliveryNote.customer?.email}</div>
            <div className="text-muted-foreground">{deliveryNote.customer?.phone}</div>
            <div className="text-muted-foreground mt-2">{deliveryNote.customer?.address}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Items</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{deliveryNote.lines?.length || 0}</div>
            <div className="text-sm text-muted-foreground mt-2">Line Items</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
