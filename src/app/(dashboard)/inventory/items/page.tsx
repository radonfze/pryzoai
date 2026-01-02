
import { db } from "@/db";
import { items, brands, itemCategories } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { ItemsClient } from "@/components/inventory/items-client"; // Check path
import { Package, Plus } from "lucide-react";
import { GradientHeader } from "@/components/ui/gradient-header"; // Check path
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ExportButton } from "@/components/ui/export-button"; // Check path
import { getCompanyId, getUserPermissions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export default async function ItemsPage() {
    const companyId = await getCompanyId();
    if (!companyId) return null;

  const data = await db.query.items.findMany({
    where: eq(items.companyId, companyId),
    with: {
        category: true,
        brand: true,
    },
    orderBy: [desc(items.createdAt)]
  });

  const categories = await db.query.itemCategories.findMany({
      where: eq(itemCategories.companyId, companyId),
  });

  const brandList = await db.query.itemBrands.findMany({
      where: eq(itemBrands.companyId, companyId),
  });
  
  const permissions = await getUserPermissions();

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="inventory"
        title="Items Master"
        description="Manage your products, services, and inventory items"
        icon={Package}
      />
      
      <div className="flex items-center justify-end gap-2">
        <ExportButton data={data} filename="Inventory_Items" />
        {permissions.includes('inventory.items.create') && (
            <Link href="/inventory/items/new">
            <Button><Plus className="mr-2 h-4 w-4" /> Create Item</Button>
            </Link>
        )}
      </div>

      <ItemsClient 
        items={data as any}
        categories={categories}
        brands={brandList}
        permissions={permissions}
      />
    </div>
  );
}
