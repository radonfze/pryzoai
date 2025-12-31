import { db } from "@/db";
import { items } from "@/db/schema/items";
import { itemCategories, itemSubcategories, itemBrands, itemModels, brandSubcategories } from "@/db/schema/item-hierarchy";
import { uoms } from "@/db/schema/items";
import { eq, and } from "drizzle-orm";
import { getCompanyId } from "@/lib/auth";
import ItemForm from "@/components/inventory/item-form";
import GradientHeader from "@/components/ui/gradient-header";
import { Edit } from "lucide-react";
import { notFound } from "next/navigation";

export default async function EditItemPage({ params }: { params: { id: string } }) {
    const companyId = await getCompanyId();
    if (!companyId) return null;

    const item = await db.query.items.findFirst({
        where: and(eq(items.id, params.id), eq(items.companyId, companyId))
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
        initialData={item} 
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
