import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Receipt } from "lucide-react";
import GradientHeader from "@/components/ui/gradient-header";

export const dynamic = 'force-dynamic';

export default function PurchaseBillsPage() {
  // TODO: Add purchase_bills table to schema
  const bills: any[] = [];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="procurement"
        title="Purchase Bills"
        description="Record supplier invoices and track payables"
        icon={Receipt}
      />
      
      <div className="flex items-center justify-end">
        <Link href="/procurement/bills/new">
          <Button><Plus className="mr-2 h-4 w-4" /> New Bill</Button>
        </Link>
      </div>

      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg">No purchase bills yet.</p>
        <p className="text-sm mt-2">Record supplier invoices for payables tracking.</p>
      </div>
    </div>
  );
}
