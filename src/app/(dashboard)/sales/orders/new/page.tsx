import { db } from "@/db";
import { customers, items } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SalesOrderForm } from "@/components/sales/sales-order-form";
import GradientHeader from "@/components/ui/gradient-header";
import { ClipboardList } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function NewSalesOrderPage() {
  const companyId = "00000000-0000-0000-0000-000000000000";

  const customerList = await db.query.customers.findMany({
    where: eq(customers.companyId, companyId),
    columns: { id: true, name: true }
  });

  const itemList = await db.query.items.findMany({
    where: eq(items.companyId, companyId),
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
        title="New Sales Order"
        description="Create a confirmed order for fulfillment"
        icon={ClipboardList}
      />
      <SalesOrderForm customers={customerList} items={itemList} />
    </div>
  );
}
