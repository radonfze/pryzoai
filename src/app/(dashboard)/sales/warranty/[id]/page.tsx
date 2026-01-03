import { db } from "@/db";
import { warrantyClaims, customers, items } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import GradientHeader from "@/components/ui/gradient-header";
import { ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function WarrantyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const warranty = await db.query.warrantyClaims.findFirst({
    where: eq(warrantyClaims.id, id),
    with: {
      customer: true,
      item: true,
    }
  });

  if (!warranty) notFound();

  const isExpired = warranty.expiryDate ? new Date(warranty.expiryDate) < new Date() : false;

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="sales"
        title={`Warranty: ${warranty.warrantyNumber}`}
        description={`Customer: ${warranty.customer?.name || "N/A"}`}
        icon={ShieldCheck}
      />

      <div className="flex justify-end gap-2">
        <Link href={`/sales/warranty`}>
          <Button variant="outline">Back to List</Button>
        </Link>
        <Link href={`/sales/warranty/${id}/edit`}>
          <Button variant="outline">Edit</Button>
        </Link>
        <Button>Process Claim</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-lg">Warranty Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Warranty #</span><span className="font-medium">{warranty.warrantyNumber}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Start Date</span><span>{warranty.startDate ? format(new Date(warranty.startDate), "dd MMM yyyy") : "-"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Expiry Date</span><span>{warranty.expiryDate ? format(new Date(warranty.expiryDate), "dd MMM yyyy") : "-"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant={isExpired ? "destructive" : "default"}>{isExpired ? "Expired" : warranty.status}</Badge></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Customer</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="font-medium">{warranty.customer?.name}</div>
            <div className="text-muted-foreground">{warranty.customer?.email}</div>
            <div className="text-muted-foreground">{warranty.customer?.phone}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Product</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="font-medium">{warranty.item?.name}</div>
            <div className="text-muted-foreground">Serial: {warranty.serialNumber || "-"}</div>
            <div className="text-muted-foreground">SKU: {warranty.item?.sku || "-"}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Terms & Conditions</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{warranty.terms || "Standard warranty terms apply"}</p>
        </CardContent>
      </Card>
    </div>
  );
}
