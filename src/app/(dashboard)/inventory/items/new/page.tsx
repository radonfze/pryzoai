import { db } from "@/db";
import { items, itemCategories, itemBrands, itemModels, itemSubcategories, brandSubcategories, brandCategories } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCompanyIdSafe } from "@/lib/auth";
import { getActiveUoms } from "@/actions/inventory/uom";
import { getNextItemCode } from "@/actions/inventory/item-actions";
import ItemForm from "@/components/inventory/item-form";
import GradientHeader from "@/components/ui/gradient-header";
import { PackagePlus, Copy } from "lucide-react";
import { logout } from "@/lib/auth/auth-service";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export const dynamic = 'force-dynamic';

interface NewItemPageProps {
  searchParams: Promise<{ duplicate?: string }>;
}

export default async function NewItemPage({ searchParams }: NewItemPageProps) {
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

    const params = await searchParams;
    const duplicateId = params.duplicate;

    const [categoryList, subCategoryList, brandList, modelList, uomList, brandMapping, brandCategoryMapping, nextCode] = await Promise.all([
        db.query.itemCategories.findMany({ where: and(eq(itemCategories.companyId, companyId), eq(itemCategories.isActive, true)) }),
        db.query.itemSubcategories.findMany({ where: and(eq(itemSubcategories.companyId, companyId), eq(itemSubcategories.isActive, true)) }),
        db.query.itemBrands.findMany({ where: and(eq(itemBrands.companyId, companyId), eq(itemBrands.isActive, true)) }),
        db.query.itemModels.findMany({ where: eq(itemModels.companyId, companyId) }),
        getActiveUoms(),
        db.select({ brandId: brandSubcategories.brandId, subcategoryId: brandSubcategories.subcategoryId }).from(brandSubcategories),
        db.select({ brandId: brandCategories.brandId, categoryId: brandCategories.categoryId }).from(brandCategories),
        getNextItemCode(),
    ]);

    // If duplicating, fetch the source item
    let sourceItem = null;
    if (duplicateId) {
      sourceItem = await db.query.items.findFirst({
        where: and(eq(items.id, duplicateId), eq(items.companyId, companyId))
      });
      // Clear the ID and code so it creates a new item
      if (sourceItem) {
        sourceItem = { ...sourceItem, id: undefined, code: nextCode };
      }
    }

    const isDuplicate = !!sourceItem;

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="inventory"
        title={isDuplicate ? "Duplicate Item" : "Create New Item"}
        description={isDuplicate ? `Copying from: ${sourceItem?.name}` : "Add a new product or service to your master inventory."}
        icon={isDuplicate ? Copy : PackagePlus}
        size="small"
      />
      <ItemForm 
        initialData={sourceItem || undefined}
        categories={categoryList} 
        subCategories={subCategoryList}
        brands={brandList} 
        models={modelList} 
        uoms={uomList}
        brandMappings={brandMapping}
        brandCategoryMappings={brandCategoryMapping}
        initialCode={nextCode}
        isDuplicate={isDuplicate}
      />
    </div>
  );
}

