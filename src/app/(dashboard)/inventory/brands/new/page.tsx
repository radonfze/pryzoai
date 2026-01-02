import { BrandForm } from "@/components/inventory/brand-form";
import { GradientHeader } from "@/components/ui/gradient-header";
import { getCategories } from "@/actions/inventory/categories";
import { getNextBrandCode } from "@/actions/inventory/brands";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewBrandPage() {
  const categories = await getCategories();
  const nextCode = await getNextBrandCode();
  
  return (
    <div className="space-y-6">
      <GradientHeader
        module="inventory"
        title="New Brand"
        description="Create a new item brand"
        icon="Plus"
        backLink="/inventory/brands"
      />
      <div className="max-w-2xl mx-auto">
        <BrandForm 
            initialCode={nextCode}
            categories={categories.map(c => ({ 
            id: c.id, 
            code: c.code, 
            name: c.name 
        }))} />
      </div>
    </div>
  );
}
