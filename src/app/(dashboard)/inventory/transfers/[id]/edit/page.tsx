import { db } from "@/db";
import { warehouses, items, stockTransfers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { StockTransferForm } from "@/components/inventory/stock-transfer-form";
import GradientHeader from "@/components/ui/gradient-header";
import { ArrowRightLeft } from "lucide-react";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function EditStockTransferPage({ params }: { params: { id: string } }) {
  const companyId = "00000000-0000-0000-0000-000000000000";

  const transfer = await db.query.stockTransfers.findFirst({
      where: eq(stockTransfers.id, params.id),
      with: {
          lines: true
      }
  });

  if (!transfer) notFound();

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
        title={`Edit Transfer: ${transfer.transferNumber}`}
        description="Modify stock transfer details"
        icon={ArrowRightLeft}
      />
      <StockTransferForm 
        warehouses={warehouseList} 
        items={itemList} 
        initialData={transfer}
      />
    </div>
  );
}
