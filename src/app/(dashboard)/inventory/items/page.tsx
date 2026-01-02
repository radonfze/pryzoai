import { db } from "@/db";
import { getUserPermissions } from "@/lib/auth";

  // ... (inside component)
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
        brands={brands}
        permissions={permissions}
      />
    </div>
  );
}


