import { db } from "@/db";
import { itemCategories, itemBrands, itemModels, itemSubcategories, brandSubcategories, brandCategories } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCompanyId } from "@/lib/auth";
import { getActiveUoms } from "@/actions/inventory/uom";
import ItemForm from "@/components/inventory/item-form";
import GradientHeader from "@/components/ui/gradient-header";
import { PackagePlus } from "lucide-react";


export default async function NewItemPage() {
    const companyId = await getCompanyId();
    if (!companyId) return null;

    const [categoryList, subCategoryList, brandList, modelList, uomList, brandMapping, brandCategoryMapping] = await Promise.all([
        db.query.itemCategories.findMany({ where: and(eq(itemCategories.companyId, companyId), eq(itemCategories.isActive, true)) }),
        db.query.itemSubcategories.findMany({ where: and(eq(itemSubcategories.companyId, companyId), eq(itemSubcategories.isActive, true)) }),
        db.query.itemBrands.findMany({ where: and(eq(itemBrands.companyId, companyId), eq(itemBrands.isActive, true)) }),
        db.query.itemModels.findMany({ where: eq(itemModels.companyId, companyId) }),
        getActiveUoms(),
        db.select({ brandId: brandSubcategories.brandId, subcategoryId: brandSubcategories.subcategoryId }).from(brandSubcategories),
        db.select({ brandId: brandCategories.brandId, categoryId: brandCategories.categoryId }).from(brandCategories),
    ]);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="inventory"
        title="Create New Item"
        description="Add a new product or service to your master inventory."
        icon={PackagePlus}
      />
      <ItemForm 
        categories={categoryList} 
        subCategories={subCategoryList}
        brands={brandList} 
        models={modelList} 
        uoms={uomList}
        brandMappings={brandMapping}
        brandCategoryMappings={brandCategoryMapping}
      />
    </div>
  );
}
