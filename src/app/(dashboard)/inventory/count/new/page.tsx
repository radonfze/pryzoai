import { GradientHeader } from "@/components/ui/gradient-header";
import { ClipboardList } from "lucide-react";
import { StockCountGenerator } from "@/components/inventory/stock-count-generator";
import { db } from "@/db";
import { getCompanyIdSafe } from "@/lib/auth";
import { warehouses, itemCategories, itemBrands } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export default async function NewStockCountPage() {
    const companyId = await getCompanyIdSafe();
    if (!companyId) return null;

    // Fetch dependencies
    const warehouseData = await db.query.warehouses.findMany({
        where: eq(warehouses.companyId, companyId),
        columns: { id: true, name: true }
    });

    const categories = await db.query.itemCategories.findMany({
         where: eq(itemCategories.companyId, companyId),
         columns: { id: true, name: true }
    });

    const brands = await db.query.itemBrands.findMany({
         where: eq(itemBrands.companyId, companyId),
         columns: { id: true, name: true }
    });

  return (
    <div className="space-y-6">
      <GradientHeader
        module="inventory"
        title="New Stock Count"
        description="Initialize a new stock counting session"
        icon={ClipboardList}
      />
      
      <StockCountGenerator 
        warehouses={warehouseData} 
        categories={categories}
        brands={brands}
      />
    </div>
  );
}

