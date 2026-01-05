import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Receipt } from "lucide-react";
import GradientHeader from "@/components/ui/gradient-header";
import { db } from "@/db";
import { purchaseInvoices } from "@/db/schema";
import { desc } from "drizzle-orm";
import { BillsTable } from "./bills-table";
import { ExportButton } from "@/components/ui/export-button";

export const dynamic = 'force-dynamic';

export default async function PurchaseBillsPage() {
  const bills = await db.query.purchaseInvoices.findMany({
    with: {
      supplier: true
    },
    orderBy: [desc(purchaseInvoices.invoiceDate)],
  });

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="procurement"
        title="Purchase Bills"
        description="Record supplier invoices and track payables"
        icon={Receipt}
      />
      
      <div className="flex items-center justify-end gap-2">
         <ExportButton data={bills} filename="Purchase_Bills" />
         <Link href="/procurement/bills/new">
           <Button><Plus className="mr-2 h-4 w-4" /> New Bill</Button>
         </Link>
      </div>

      <div className="rounded-md border bg-white">
        <BillsTable data={bills as any} />
      </div>
    </div>
  );
}
