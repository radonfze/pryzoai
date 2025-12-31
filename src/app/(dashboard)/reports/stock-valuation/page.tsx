import StockValuationClient from "@/components/reports/stock-valuation-client";
import GradientHeader from "@/components/ui/gradient-header";
import { Package } from "lucide-react";

export const dynamic = 'force-dynamic';

export default function StockValuationPage() {
  return (
    <div className="flex flex-col gap-6 p-4 pt-0">
      <GradientHeader
          module="inventory"
          title="Stock Valuation"
          description="Current inventory value based on Weighted Average Cost."
          icon={Package}
      />
      
      <StockValuationClient />
    </div>
  );
}
