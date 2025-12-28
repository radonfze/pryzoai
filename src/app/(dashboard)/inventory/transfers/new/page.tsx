import { db } from "@/db";
import { warehouses, items } from "@/db/schema";
import { eq } from "drizzle-orm";
import { StockTransferForm } from "@/components/inventory/stock-transfer-form";
import GradientHeader from "@/components/ui/gradient-header";
import { ArrowRightLeft } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function NewTransferPage() {
  const companyId = "00000000-0000-0000-0000-000000000000";

  const warehouseList = await db.query.warehouses.findMany({
    where: eq(warehouses.companyId, companyId),
  });

  const itemList = await db.query.items.findMany({
    where: eq(items.companyId, companyId),
    columns: {
        id: true,
        code: true,
        name: true
    }
  });

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="inventory"
        title="New Stock Transfer"
        description="Move inventory between warehouses"
        icon={ArrowRightLeft}
      />
      <StockTransferForm warehouses={warehouseList} items={itemList} />
    </div>
  );
}
