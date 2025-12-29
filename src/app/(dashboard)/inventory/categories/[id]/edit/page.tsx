import { CategoryForm } from "@/components/inventory/category-form";
import { GradientHeader } from "@/components/ui/gradient-header";
import { getCategory } from "@/actions/inventory/categories";
import { notFound } from "next/navigation";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const category = await getCategory(resolvedParams.id);

  if (!category) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <GradientHeader
        module="inventory"
        title="Edit Category"
        description={`Edit category: ${category.name}`}
        icon="Edit"
        backLink="/inventory/categories"
      />
      <div className="max-w-2xl mx-auto">
        <CategoryForm initialData={category} />
      </div>
    </div>
  );
}
