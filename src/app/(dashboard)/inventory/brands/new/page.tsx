import { BrandForm } from "@/components/inventory/brand-form";
import { GradientHeader } from "@/components/ui/gradient-header";
import { getCategories } from "@/actions/inventory/categories";

export default async function NewBrandPage() {
  const categories = await getCategories();
  
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
        <BrandForm categories={categories.map(c => ({ 
            id: c.id, 
            code: c.code, 
            name: c.name 
        }))} />
      </div>
    </div>
  );
}
