
import GradientHeader from "@/components/ui/gradient-header";
import { Wrench } from "lucide-react";

export default function WorkOrdersPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <GradientHeader
        module="manufacturing"
        title="Work Orders"
        description="Track production jobs and assembly tasks"
        icon={Wrench}
      />
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
        <div className="text-center">
            <h3 className="text-lg font-medium">Coming Soon</h3>
            <p className="text-sm text-muted-foreground">Work Order management module is under development.</p>
        </div>
      </div>
    </div>
  );
}
