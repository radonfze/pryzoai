
import GradientHeader from "@/components/ui/gradient-header";
import { Landmark } from "lucide-react";

export default function ReconciliationPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <GradientHeader
        module="finance"
        title="Bank Reconciliation"
        description="Match bank statements with system records"
        icon={Landmark}
      />
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
        <div className="text-center">
            <h3 className="text-lg font-medium">Coming Soon</h3>
            <p className="text-sm text-muted-foreground">Reconciliation module is under development.</p>
        </div>
      </div>
    </div>
  );
}
