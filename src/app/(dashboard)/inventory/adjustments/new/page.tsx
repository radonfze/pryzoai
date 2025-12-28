import { db } from "@/db";
import { items, warehouses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { StockAdjustmentForm } from "@/components/inventory/stock-adjustment-form";
import GradientHeader from "@/components/ui/gradient-header";
import { ClipboardList } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function NewAdjustmentPage() {
  const companyId = "00000000-0000-0000-0000-000000000000";

  const itemList = await db.query.items.findMany({
    where: and(eq(items.companyId, companyId), eq(items.isActive, true)),
    columns: { id: true, code: true, name: true }
  });

  const warehouseList = await db.query.warehouses.findMany({
      where: eq(warehouses.companyId, companyId),
      columns: { id: true, name: true }
  });

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="inventory"
        title="New Stock Adjustment"
        description="Correct stock levels manually"
        icon={ClipboardList}
      />
      <StockAdjustmentForm items={itemList} warehouses={warehouseList} />
    </div>
  );
}
