import { db } from "@/db";
import { suppliers, items, purchaseOrders } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { PurchaseOrderForm } from "@/components/procurement/purchase-order-form";
import GradientHeader from "@/components/ui/gradient-header";
import { ShoppingCart } from "lucide-react";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function EditPurchaseOrderPage({ params }: { params: { id: string } }) {
  const companyId = "00000000-0000-0000-0000-000000000000";

  const order = await db.query.purchaseOrders.findFirst({
      where: eq(purchaseOrders.id, params.id),
      with: {
          lines: true
      }
  });

  if (!order) notFound();

  const supplierList = await db.query.suppliers.findMany({
    where: eq(suppliers.companyId, companyId),
    columns: { id: true, name: true }
  });

  const itemList = await db.query.items.findMany({
    where: eq(items.companyId, companyId),
    columns: {
        id: true,
        code: true,
        name: true,
        purchasePrice: true,
        costPrice: true,
        uom: true
    }
  });

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="procurement"
        title={`Edit Purchase Order: ${order.orderNumber}`}
        description="Modify purchase order details"
        icon={ShoppingCart}
      />
      <PurchaseOrderForm 
        suppliers={supplierList} 
        items={itemList} 
        initialData={order}
      />
    </div>
  );
}
