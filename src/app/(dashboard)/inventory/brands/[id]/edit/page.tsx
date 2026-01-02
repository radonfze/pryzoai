
import { BrandForm } from "@/components/inventory/brand-form";
import { GradientHeader } from "@/components/ui/gradient-header";
import { getBrand } from "@/actions/inventory/brands";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditBrandPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const brand = await getBrand(resolvedParams.id);

  if (!brand) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <GradientHeader
        module="inventory"
        title="Edit Brand"
        description={`Edit brand: ${brand.name}`}
        icon="Edit"
        backLink="/inventory/brands"
      />
      <div className="max-w-2xl mx-auto">
        <BrandForm initialData={brand} />
      </div>
    </div>
  );
}
