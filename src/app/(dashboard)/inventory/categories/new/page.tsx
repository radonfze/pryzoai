import { CategoryForm } from "@/components/inventory/category-form";
import { GradientHeader } from "@/components/ui/gradient-header";

export default function NewCategoryPage() {
  return (
    <div className="space-y-6">
      <GradientHeader
        module="inventory"
        title="New Category"
        description="Create a new item category"
        icon="Plus"
        backLink="/inventory/categories"
      />
      <div className="max-w-2xl mx-auto">
        <CategoryForm />
      </div>
    </div>
  );
}
