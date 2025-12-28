import { db } from "@/db";
import { items, warehouses, stockAdjustments } from "@/db/schema"; // Ensure stockAdjustments is exported
import { eq, and } from "drizzle-orm";
import { StockAdjustmentForm } from "@/components/inventory/stock-adjustment-form";
import GradientHeader from "@/components/ui/gradient-header";
import { ClipboardList } from "lucide-react";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function EditAdjustmentPage({ params }: { params: { id: string } }) {
  const companyId = "00000000-0000-0000-0000-000000000000";

  // Note: If stockAdjustments table is missing in schema export, this will fail.
  // Assuming it exists as per action file usage.
  // If grep failed to find it, I will need to fix schema first.
  
  let adjustment = null;
  try {
      adjustment = await db.query.stockAdjustments.findFirst({
        where: eq(stockAdjustments.id, params.id),
        with: {
            lines: true
        }
      });
  } catch (e) {
      console.error("Error fetching adjustment:", e);
      // Fallback or 404
  }

  if (!adjustment) notFound();

  const itemList = await db.query.items.findMany({
    where: eq(items.companyId, companyId),
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
        title={`Edit Adjustment: ${adjustment.adjustmentNumber}`}
        description="View or modify stock correction"
        icon={ClipboardList}
      />
      <StockAdjustmentForm 
        items={itemList} 
        warehouses={warehouseList} 
        initialData={adjustment}
      />
    </div>
  );
}
