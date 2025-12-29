import { SubcategoryForm } from "@/components/inventory/subcategory-form";
import { GradientHeader } from "@/components/ui/gradient-header";
import { getCategories } from "@/actions/inventory/categories";

export default async function NewSubcategoryPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <GradientHeader
        module="inventory"
        title="New Subcategory"
        description="Create a new item subcategory"
        icon="Plus"
        backLink="/inventory/subcategories"
      />
      <div className="max-w-2xl mx-auto">
        <SubcategoryForm categories={categories} />
      </div>
    </div>
  );
}
