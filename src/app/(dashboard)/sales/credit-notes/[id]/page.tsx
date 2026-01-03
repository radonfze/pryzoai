import { db } from "@/db";
import { salesReturns, customers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import GradientHeader from "@/components/ui/gradient-header";
import { Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import Link from "next/link";

export const dynamic = 'force-dynamic';

// Credit notes use salesReturns table with a credit note flag or separate processing
export default async function CreditNoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // For now, credit notes are linked to sales returns
  const creditNote = await db.query.salesReturns.findFirst({
    where: eq(salesReturns.id, id),
    with: {
      customer: true,
      invoice: true,
    }
  });

  if (!creditNote) notFound();

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="sales"
        title={`Credit Note: ${creditNote.returnNumber}`}
        description={`Customer: ${creditNote.customer?.name || "N/A"}`}
        icon={Receipt}
      />

      <div className="flex justify-end gap-2">
        <Link href={`/sales/credit-notes`}>
          <Button variant="outline">Back to List</Button>
        </Link>
        <Button variant="outline">Print</Button>
        <Button>Post Credit Note</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-lg">Credit Note Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Credit Note #</span><span className="font-medium">{creditNote.returnNumber}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{format(new Date(creditNote.returnDate), "dd MMM yyyy")}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Original Invoice</span><span>{creditNote.invoice?.invoiceNumber || "-"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant="outline">{creditNote.status}</Badge></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Customer</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="font-medium">{creditNote.customer?.name}</div>
            <div className="text-muted-foreground">{creditNote.customer?.email}</div>
            <div className="text-muted-foreground">{creditNote.customer?.phone}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Amount</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{Number(creditNote.totalAmount).toLocaleString()} AED</div>
            <div className="text-sm text-muted-foreground mt-2">Credit to Customer</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Reason</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{creditNote.reason || "No reason provided"}</p>
        </CardContent>
      </Card>
    </div>
  );
}
