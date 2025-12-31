import TrialBalanceClient from "@/components/reports/trial-balance-client";
import GradientHeader from "@/components/ui/gradient-header";
import { Scale } from "lucide-react";

export const dynamic = 'force-dynamic';

export default function TrialBalancePage() {
  return (
    <div className="flex flex-col gap-6 p-4 pt-0">
      <GradientHeader
          module="finance"
          title="Trial Balance"
          description="Summary of all ledger balances to ensure double-entry compliance."
          icon={Scale}
      />
      
      <TrialBalanceClient />
    </div>
  );
}
