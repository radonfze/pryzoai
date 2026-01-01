import { CategoryForm } from "@/components/inventory/category-form";
import { GradientHeader } from "@/components/ui/gradient-header";
import { getActiveUoms } from "@/actions/inventory/uom";
import { Plus } from "lucide-react";

export default async function NewCategoryPage() {
  const uoms = await getActiveUoms();

  return (
    <div className="space-y-6">
      <GradientHeader
        module="inventory"
        title="New Category"
        description="Create a new item category"
        icon={Plus}
        backLink="/inventory/categories"
      />
      <div className="max-w-2xl mx-auto">
        <CategoryForm uoms={uoms} />
      </div>
    </div>
  );
}
