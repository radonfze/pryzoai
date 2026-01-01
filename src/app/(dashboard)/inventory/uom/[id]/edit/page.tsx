import { notFound } from "next/navigation";
import { GradientHeader } from "@/components/ui/gradient-header";
import { UomForm } from "@/components/inventory/uom-form";
import { getUom } from "@/actions/inventory/uom";
import { Scale } from "lucide-react";

interface EditUOMPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditUOMPage({ params }: EditUOMPageProps) {
  const { id } = await params;
  const uom = await getUom(id);
  
  if (!uom) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <GradientHeader
        module="inventory"
        title="Edit Unit of Measure"
        description={`Editing: ${uom.name}`}
        icon={Scale}
        backLink="/inventory/uom"
      />
      
      <div className="max-w-2xl mx-auto">
        <UomForm initialData={{
          id: uom.id,
          code: uom.code,
          name: uom.name,
          isActive: uom.isActive,
        }} />
      </div>
    </div>
  );
}
