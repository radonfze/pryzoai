import { CategoryForm } from "@/components/inventory/category-form";
import { GradientHeader } from "@/components/ui/gradient-header";
import { getActiveUoms } from "@/actions/inventory/uom";
import { getNextCategoryCode } from "@/actions/inventory/categories";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewCategoryPage() {
  const [uoms, nextCode] = await Promise.all([
    getActiveUoms(),
    getNextCategoryCode(),
  ]);

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
        <CategoryForm uoms={uoms} initialCode={nextCode} />
      </div>
    </div>
  );
}
