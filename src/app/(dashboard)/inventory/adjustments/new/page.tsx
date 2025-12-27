import { db } from "@/db";
import { items, warehouses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import AdjustmentForm from "@/components/inventory/adjustment-form";

export default async function NewAdjustmentPage() {
  const companyId = "00000000-0000-0000-0000-000000000000";

  const itemList = await db.query.items.findMany({
    where: and(eq(items.companyId, companyId), eq(items.isActive, true))
  });

  const warehouseList = await db.query.warehouses.findMany({
      where: eq(warehouses.companyId, companyId)
  });

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
       <AdjustmentForm items={itemList} warehouses={warehouseList} />
    </div>
  );
}
