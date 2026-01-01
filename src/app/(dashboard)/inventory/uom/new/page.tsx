import { GradientHeader } from "@/components/ui/gradient-header";
import { UomForm } from "@/components/inventory/uom-form";
import { Scale } from "lucide-react";

export default function NewUOMPage() {
  return (
    <div className="space-y-6">
      <GradientHeader
        module="inventory"
        title="New Unit of Measure"
        description="Create a new unit of measure"
        icon={Scale}
        backLink="/inventory/uom"
      />
      
      <div className="max-w-2xl mx-auto">
        <UomForm />
      </div>
    </div>
  );
}
