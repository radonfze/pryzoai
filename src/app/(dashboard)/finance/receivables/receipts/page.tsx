import { db } from "@/db";
import { customerPayments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, CreditCard } from "lucide-react";
import GradientHeader from "@/components/ui/gradient-header";
import { CustomerPaymentsTable } from "@/components/sales/customer-payments-table";

export const dynamic = 'force-dynamic';

export default async function SalesPaymentsPage() {
  const companyId = "00000000-0000-0000-0000-000000000000";

  const payments = await db.query.customerPayments.findMany({
    where: eq(customerPayments.companyId, companyId),
    with: { customer: true },
    orderBy: [desc(customerPayments.createdAt)],
    limit: 100
  });

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="sales"
        title="Customer Payments"
        description="Manage payment receipts and allocations"
        icon={CreditCard}
      />

      <div className="flex justify-end">
        <Link href="/sales/payments/new">
          <Button><Plus className="mr-2 h-4 w-4" /> Receive Payment</Button>
        </Link>
      </div>

      <CustomerPaymentsTable payments={payments} />
    </div>
  );
}
