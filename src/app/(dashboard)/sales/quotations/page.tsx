import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, FileCheck } from "lucide-react";

export const dynamic = 'force-dynamic';

export default function QuotationsPage() {
  // TODO: Add quotations table to schema
  const quoteList: any[] = [];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Quotations</h2>
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
