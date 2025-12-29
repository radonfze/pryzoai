
import { db } from "@/db";
import { customers, items, salesOrders, salesLines } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SalesOrderForm } from "@/components/sales/sales-order-form";
import GradientHeader from "@/components/ui/gradient-header";
import { ClipboardList } from "lucide-react";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function EditSalesOrderPage({ params }: { params: { id: string } }) {
  const companyId = "00000000-0000-0000-0000-000000000000";

  // Fetch Order
  const order = await db.query.salesOrders.findFirst({
      where: eq(salesOrders.id, params.id),
      with: {
          lines: true
      }
  });

  if (!order) return notFound();

  // Fetch Master Data
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
        title="Edit Sales Order"
        description={`Edit order ${order.orderNumber}`}
        icon={ClipboardList}
      />
      <SalesOrderForm 
        customers={customerList} 
        items={itemList} 
        initialData={order}
        isEdit={true}
      />
    </div>
  );
}
