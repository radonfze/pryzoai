import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, CreditCard, Wallet } from "lucide-react";
import GradientHeader from "@/components/ui/gradient-header";

export const dynamic = 'force-dynamic';

export default function CustomerPaymentsPage() {
  // TODO: Add customer_payments table to schema
  const payments: any[] = [];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="sales"
        title="Customer Payments"
        description="Record and track customer payments against invoices"
        icon={Wallet}
      />
      
      <div className="flex items-center justify-end">
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
