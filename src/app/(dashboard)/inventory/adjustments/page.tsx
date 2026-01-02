import { GradientHeader } from "@/components/ui/gradient-header";
import { ClipboardList, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getStockAdjustments } from "@/actions/inventory/create-stock-adjustment";
import { AdjustmentsClient } from "./client";

export const dynamic = 'force-dynamic';

export default async function StockAdjustmentsPage() {
  const adjustmentsRaw = await getStockAdjustments();
  
  // Serialize dates for client component
  const adjustments = adjustmentsRaw.map(adj => ({
    ...adj,
    adjustmentDate: adj.adjustmentDate,
    createdAt: adj.createdAt,
  }));

  return (
    <div className="space-y-6">
      <GradientHeader
        module="inventory"
        title="Stock Adjustments"
        description="View and manage stock adjustments"
        icon={ClipboardList}
      >
        <Link href="/inventory/adjustments/new">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Adjustment
          </Button>
        </Link>
      </GradientHeader>
      
      <AdjustmentsClient data={adjustments as any} />
    </div>
  );
}
