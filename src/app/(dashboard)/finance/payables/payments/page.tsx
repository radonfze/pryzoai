import { db } from "@/db";
import { supplierPayments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, CreditCard } from "lucide-react";
import GradientHeader from "@/components/ui/gradient-header";
import { SupplierPaymentsTable } from "@/components/procurement/supplier-payments-table";

export const dynamic = 'force-dynamic';

export default async function SupplierPaymentsPage() {
  const companyId = "00000000-0000-0000-0000-000000000000";

  const payments = await db.query.supplierPayments.findMany({
    where: eq(supplierPayments.companyId, companyId),
    with: { supplier: true },
    orderBy: [desc(supplierPayments.createdAt)],
    limit: 100
  });

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="procurement"
        title="Supplier Payments"
        description="Manage bill payments and allocations"
        icon={CreditCard}
      />

      <div className="flex justify-end">
        <Link href="/procurement/payments/new">
          <Button><Plus className="mr-2 h-4 w-4" /> Make Payment</Button>
        </Link>
      </div>

      <SupplierPaymentsTable payments={payments} />
    </div>
  );
}
