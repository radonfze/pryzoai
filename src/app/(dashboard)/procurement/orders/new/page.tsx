import { db } from "@/db";
import { suppliers, items } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { PurchaseOrderForm } from "@/components/procurement/purchase-order-form";
import GradientHeader from "@/components/ui/gradient-header";
import { ShoppingCart } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function NewPurchaseOrderPage() {
  const companyId = "00000000-0000-0000-0000-000000000000";

  const supplierList = await db.query.suppliers.findMany({
    where: and(eq(suppliers.companyId, companyId), eq(suppliers.isActive, true)),
    columns: { id: true, name: true }
  });

  const itemList = await db.query.items.findMany({
    where: and(eq(items.companyId, companyId), eq(items.isActive, true)),
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
        title="New Purchase Order"
        description="Create a new order for supplies"
        icon={ShoppingCart}
      />
      <PurchaseOrderForm suppliers={supplierList} items={itemList} />
    </div>
  );
}
