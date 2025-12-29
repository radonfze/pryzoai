import { SubcategoryForm } from "@/components/inventory/subcategory-form";
import { GradientHeader } from "@/components/ui/gradient-header";
import { getCategories } from "@/actions/inventory/categories";
import { getSubcategory } from "@/actions/inventory/subcategories";
import { notFound } from "next/navigation";

export default async function EditSubcategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const [subcategory, categories] = await Promise.all([
    getSubcategory(resolvedParams.id),
    getCategories(),
  ]);

  if (!subcategory) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <GradientHeader
        module="inventory"
        title="Edit Subcategory"
        description={`Edit subcategory: ${subcategory.name}`}
        icon="Edit"
        backLink="/inventory/subcategories"
      />
      <div className="max-w-2xl mx-auto">
        <SubcategoryForm initialData={subcategory} categories={categories} />
      </div>
    </div>
  );
}
