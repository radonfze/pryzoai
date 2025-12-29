import { ModelForm } from "@/components/inventory/model-form";
import { GradientHeader } from "@/components/ui/gradient-header";
import { getBrands } from "@/actions/inventory/brands";
import { getSubcategories } from "@/actions/inventory/subcategories";

export default async function NewModelPage() {
  const [brands, subcategories] = await Promise.all([
    getBrands(),
    getSubcategories(),
  ]);

  return (
    <div className="space-y-6">
      <GradientHeader
        module="inventory"
        title="New Model"
        description="Create a new item model"
        icon="Plus"
        backLink="/inventory/models"
      />
      <div className="max-w-2xl mx-auto">
        <ModelForm brands={brands} subcategories={subcategories} />
      </div>
    </div>
  );
}
