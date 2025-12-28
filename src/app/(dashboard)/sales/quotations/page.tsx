import { Plus, FileCheck, FileText } from "lucide-react";
import GradientHeader from "@/components/ui/gradient-header";

export const dynamic = 'force-dynamic';

export default function QuotationsPage() {
  // TODO: Add quotations table to schema
  const quoteList: any[] = [];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="sales"
        title="Quotations"
        description="Create and send pricing quotes to customers"
        icon={FileText}
      />
      
      <div className="flex items-center justify-end">
        <Link href="/sales/quotations/new">
          <Button><Plus className="mr-2 h-4 w-4" /> New Quotation</Button>
        </Link>
      </div>

      <div className="text-center py-12 text-muted-foreground">
        <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg">No quotations yet.</p>
        <p className="text-sm mt-2">Create quotations to send pricing to customers.</p>
      </div>
    </div>
  );
}
