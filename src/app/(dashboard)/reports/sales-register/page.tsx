import SalesRegisterClient from "@/components/reports/sales-register-client";
import GradientHeader from "@/components/ui/gradient-header";
import { FileBarChart } from "lucide-react";

export const dynamic = 'force-dynamic';

export default function SalesRegisterPage() {
  return (
    <div className="flex flex-col gap-6 p-4 pt-0">
      <GradientHeader
          module="sales"
          title="Sales Register"
          description="Detailed report of all sales invoices and credit notes."
          icon={FileBarChart}
      />
      
      <SalesRegisterClient />
    </div>
  );
}
