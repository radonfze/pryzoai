import { db } from "@/db";
import { customers, items } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { RecurringInvoiceForm } from "@/components/sales/recurring-invoice-form";
import GradientHeader from "@/components/ui/gradient-header";
import { Calendar } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function NewRecurringInvoicePage() {
  const companyId = "00000000-0000-0000-0000-000000000000";

  const customerList = await db.query.customers.findMany({
    where: and(eq(customers.companyId, companyId), eq(customers.isActive, true)),
    columns: { id: true, name: true }
  });

  const itemList = await db.query.items.findMany({
    where: and(eq(items.companyId, companyId), eq(items.isActive, true)),
    columns: {
        id: true,
        code: true,
        name: true,
        sellingPrice: true,
        uom: true
    }
  });

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="sales"
        title="New Recurring Template"
        description="Schedule automated invoice generation"
        icon={Calendar}
      />
      <RecurringInvoiceForm customers={customerList} items={itemList} />
    </div>
  );
}
