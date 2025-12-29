
import GradientHeader from "@/components/ui/gradient-header";
import { Settings } from "lucide-react";

export default function BOMPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <GradientHeader
        module="manufacturing"
        title="Bill of Materials"
        description="Manage product recipes and component lists"
        icon={Settings}
      />
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
        <div className="text-center">
            <h3 className="text-lg font-medium">Coming Soon</h3>
            <p className="text-sm text-muted-foreground">BOM management module is under development.</p>
        </div>
      </div>
    </div>
  );
}
