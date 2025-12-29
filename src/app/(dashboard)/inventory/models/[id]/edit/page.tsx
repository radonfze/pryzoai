import { ModelForm } from "@/components/inventory/model-form";
import { GradientHeader } from "@/components/ui/gradient-header";
import { getModel } from "@/actions/inventory/models";
import { getBrands } from "@/actions/inventory/brands";
import { getSubcategories } from "@/actions/inventory/subcategories";
import { notFound } from "next/navigation";

export default async function EditModelPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const [model, brands, subcategories] = await Promise.all([
    getModel(resolvedParams.id),
    getBrands(),
    getSubcategories(),
  ]);

  if (!model) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <GradientHeader
        module="inventory"
        title="Edit Model"
        description={`Edit model: ${model.name}`}
        icon="Edit"
        backLink="/inventory/models"
      />
      <div className="max-w-2xl mx-auto">
        <ModelForm initialData={model} brands={brands} subcategories={subcategories} />
      </div>
    </div>
  );
}
