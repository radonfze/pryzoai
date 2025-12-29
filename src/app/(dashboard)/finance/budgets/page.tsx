
import GradientHeader from "@/components/ui/gradient-header";
import { Calculator } from "lucide-react";

export default function BudgetsPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <GradientHeader
        module="finance"
        title="Budgets"
        description="Plan and track company budgets"
        icon={Calculator}
      />
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
        <div className="text-center">
            <h3 className="text-lg font-medium">Coming Soon</h3>
            <p className="text-sm text-muted-foreground">Budgeting module is under development.</p>
        </div>
      </div>
    </div>
  );
}
