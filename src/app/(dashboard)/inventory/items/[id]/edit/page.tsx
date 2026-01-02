
import { db } from "@/db";
import { items, uoms } from "@/db/schema/items";
import { itemCategories, itemSubcategories, itemBrands, itemModels, brandSubcategories } from "@/db/schema/item-hierarchy";
import { eq, and } from "drizzle-orm";
import { getCompanyIdSafe } from "@/lib/auth";
import { logout } from "@/lib/auth/auth-service";
import { redirect, notFound } from "next/navigation";
import ItemForm from "@/components/inventory/item-form";
import GradientHeader from "@/components/ui/gradient-header";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

export const dynamic = 'force-dynamic';

interface EditItemPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditItemPage({ params }: EditItemPageProps) {
    const { id } = await params;
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

    const item = await db.query.items.findFirst({
        where: and(eq(items.id, id), eq(items.companyId, companyId))
    });

    if (!item) notFound();

    const [categoryList, subCategoryList, brandList, modelList, uomList, brandMappings] = await Promise.all([
        db.query.itemCategories.findMany({ where: and(eq(itemCategories.companyId, companyId), eq(itemCategories.isActive, true)) }),
        db.query.itemSubcategories.findMany({ where: and(eq(itemSubcategories.companyId, companyId), eq(itemSubcategories.isActive, true)) }),
        db.query.itemBrands.findMany({ where: and(eq(itemBrands.companyId, companyId), eq(itemBrands.isActive, true)) }),
        db.query.itemModels.findMany({ where: and(eq(itemModels.companyId, companyId), eq(itemModels.isActive, true)) }),
        db.query.uoms.findMany({ where: eq(uoms.companyId, companyId) }),
        db.select().from(brandSubcategories),
    ]);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="inventory"
        title={`Edit ${item.name}`}
        description="Update item details."
        icon={Edit}
      />
      <ItemForm 
        initialData={{
            ...item,
            createdAt: item.createdAt?.toISOString() ?? null,
            updatedAt: item.updatedAt?.toISOString() ?? null,
            deletedAt: item.deletedAt?.toISOString() ?? null,
        }} 
        categories={categoryList} 
        subCategories={subCategoryList}
        brands={brandList} 
        models={modelList}
        uoms={uomList}
        brandMappings={brandMappings}
      />
    </div>
  );
}
