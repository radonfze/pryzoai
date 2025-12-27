import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, CreditCard } from "lucide-react";

export const dynamic = 'force-dynamic';

export default function CustomerPaymentsPage() {
  // TODO: Add customer_payments table to schema
  const payments: any[] = [];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Customer Payments</h2>
        <Link href="/sales/payments/new">
          <Button><Plus className="mr-2 h-4 w-4" /> Record Payment</Button>
        </Link>
      </div>

      <div className="text-center py-12 text-muted-foreground">
        <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg">No payments recorded yet.</p>
        <p className="text-sm mt-2">Record customer payments against invoices.</p>
      </div>
    </div>
  );
}
