import { CategoryForm } from "@/components/inventory/category-form";
import { GradientHeader } from "@/components/ui/gradient-header";
import { getCategory } from "@/actions/inventory/categories";
import { getActiveUoms } from "@/actions/inventory/uom";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const [category, uoms] = await Promise.all([
    getCategory(resolvedParams.id),
    getActiveUoms(),
  ]);

  if (!category) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <GradientHeader
        module="inventory"
        title="Edit Category"
        description={`Edit category: ${category.name}`}
        icon={Pencil}
        backLink="/inventory/categories"
      />
      <div className="max-w-2xl mx-auto">
        <CategoryForm initialData={category} uoms={uoms} />
      </div>
    </div>
  );
}
