import { db } from "@/db";
import { customerPayments, customers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import GradientHeader from "@/components/ui/gradient-header";
import { CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export const dynamic = 'force-dynamic';

export default async function PaymentDetailPage({ params }: { params: { id: string } }) {
  const payment = await db.query.customerPayments.findFirst({
    where: eq(customerPayments.id, params.id),
    with: {
      customer: true,
      allocations: {
        with: {
          invoice: true
        }
      }
    }
  });

  if (!payment) notFound();

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="sales"
        title={`Payment: ${payment.paymentNumber}`}
        description={`Customer: ${payment.customer?.name || "N/A"}`}
        icon={CreditCard}
      />

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-lg">Payment Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Number</span><span className="font-medium">{payment.paymentNumber}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{format(new Date(payment.paymentDate), "dd MMM yyyy")}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Method</span><span>{payment.paymentMethod}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Reference</span><span>{payment.reference || "-"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant="outline">{payment.status}</Badge></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Amount</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{Number(payment.amount).toLocaleString()} AED</div>
            <div className="text-sm text-muted-foreground mt-2">
              Allocated: {Number(payment.allocatedAmount || 0).toLocaleString()} AED
            </div>
            <div className="text-sm text-muted-foreground">
              Unallocated: {(Number(payment.amount) - Number(payment.allocatedAmount || 0)).toLocaleString()} AED
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Customer</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="font-medium">{payment.customer?.name}</div>
            <div className="text-muted-foreground">{payment.customer?.email}</div>
            <div className="text-muted-foreground">{payment.customer?.phone}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Invoice Allocations</CardTitle></CardHeader>
        <CardContent>
          {(payment.allocations || []).length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">No allocations yet</div>
          ) : (
            <div className="space-y-2">
              {(payment.allocations || []).map((alloc: any) => (
                <div key={alloc.id} className="flex justify-between items-center p-3 border rounded">
                  <span>{alloc.invoice?.invoiceNumber}</span>
                  <span className="font-medium">{Number(alloc.allocatedAmount).toLocaleString()} AED</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
