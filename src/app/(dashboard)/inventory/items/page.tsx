import { db } from "@/db";
import { items, itemBrands, itemCategories } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { ItemsClient } from "@/components/inventory/items-client";
import { Package, Plus } from "lucide-react";
import { GradientHeader } from "@/components/ui/gradient-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ExportButton } from "@/components/ui/export-button";
import { getCompanyIdSafe, getUserPermissions, getSession } from "@/lib/auth";
import { logout } from "@/lib/auth/auth-service";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function ItemsPage() {
    const companyId = await getCompanyIdSafe();
    if (!companyId) {
        return (
            <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight">Session Expired</h1>
                    <p className="text-muted-foreground">Your session is invalid. Please log in again.</p>
                </div>
                <form action={async () => {
                    "use server"
                    await logout();
                    redirect("/login");
                }}>
                    <Button variant="default">Return to Login</Button>
                </form>
            </div>
        );
    }

  const session = await getSession();
  const userId = session?.userId || "";

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

  // Serialization to avoid "Object not valid as React child" or client error
  const formattedItems = data.map(item => ({
      ...item,
      createdAt: item.createdAt?.toISOString() || null,
      updatedAt: item.updatedAt?.toISOString() || null,
      deletedAt: item.deletedAt?.toISOString() || null,
      // Ensure agregated fields are strings or numbers, not objects
      stockOnHand: "0",
      stockAvailable: "0",
      stockReserved: "0",
  }));

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="inventory"
        title="Items Master"
        description="Manage your products, services, and inventory items"
        icon={Package}
      />
      
      <div className="flex items-center justify-end gap-2">
        <ExportButton data={formattedItems} filename="Inventory_Items" />
        {(permissions.includes('inventory.items.create') || permissions.includes('*')) && (
            <Link href="/inventory/items/new">
            <Button><Plus className="mr-2 h-4 w-4" /> Create Item</Button>
            </Link>
        )}
      </div>

      <ItemsClient 
        items={formattedItems as any}
        categories={categories}
        brands={brandList}
        permissions={permissions}
        userId={userId}
      />
    </div>
  );
}
