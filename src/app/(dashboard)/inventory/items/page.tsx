import { db } from "@/db";
import { getCompanyId } from "@/lib/auth";
import { items } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Package } from "lucide-react";
import GradientHeader from "@/components/ui/gradient-header";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { deleteItemsAction } from "@/actions/inventory/delete-items";
import { ExportButton } from "@/components/ui/export-button";


export const dynamic = 'force-dynamic';

export default async function ItemsPage() {
  const companyId = await getCompanyId();
  if (!companyId) return null;

  const data = await db.query.items.findMany({
    where: eq(items.companyId, companyId),
    with: {
        category: true,
        brand: true,
        subCategory: true,
    },
    orderBy: [desc(items.createdAt)],
  });

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
        <Link href="/inventory/items/new">
          <Button><Plus className="mr-2 h-4 w-4" /> Create Item</Button>
        </Link>
      </div>

      <DataTable 
        columns={columns} 
        data={data} 
        searchKey="name"
        placeholder="Search items..."
        onDelete={async (ids) => {
          "use server";
          await deleteItemsAction(ids);
        }}
      />
    </div>
  );
}
