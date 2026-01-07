import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Receipt, CheckCircle2, AlertCircle } from "lucide-react";
import GradientHeader from "@/components/ui/gradient-header";
import { db } from "@/db";
import { purchaseInvoices } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { BillsTable } from "./bills-table";
import { ExportButton } from "@/components/ui/export-button";
import { StatsCards } from "@/components/dashboard/stats-cards";

export const dynamic = 'force-dynamic';

export default async function PurchaseBillsPage() {
  const bills = await db.query.purchaseInvoices.findMany({
    with: {
      supplier: true
    },
    orderBy: [desc(purchaseInvoices.invoiceDate)],
  });

  // Calculate Stats
  let statsData = {
    total: 0,
    paid: 0,
    pending: 0
  };

  try {
     // Fetch lightweight list for stats
     const statsList = await db
       .select({
         totalAmount: purchaseInvoices.totalAmount,
         balanceAmount: purchaseInvoices.balanceAmount,
         status: purchaseInvoices.status
       })
       .from(purchaseInvoices)
        .where(eq(purchaseInvoices.companyId, userId ? (session.companyId || "00000000-0000-0000-0000-000000000000") : "00000000-0000-0000-0000-000000000000"));

     statsList.forEach(bill => {
        statsData.total += Number(bill.totalAmount || 0);
        const bal = Number(bill.balanceAmount || 0);
        if (bal > 0) statsData.pending += bal;
        else statsData.paid += Number(bill.totalAmount || 0);
     });
  } catch (err) {
      console.error("Failed stats", err);
  }

  const billStats: any[] = [
    {
      title: "Total Purchases",
      value: new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(statsData.total),
      icon: Receipt,
      color: "text-blue-600"
    },
    {
      title: "Paid",
      value: new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(statsData.paid),
      icon: CheckCircle2,
      color: "text-green-600"
    },
    {
      title: "Pending Payable",
      value: new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(statsData.pending),
      icon: AlertCircle,
      description: "To be paid",
      color: "text-red-500"
    }
  ];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="procurement"
        title="Purchase Bills"
        description="Record supplier invoices and track payables"
        icon={Receipt}
      />
      
      <StatsCards stats={billStats} className="grid-cols-3" />
      
      <div className="flex items-center justify-end gap-2">
         <ExportButton data={bills} filename="Purchase_Bills" />
         <Link href="/procurement/bills/new">
           <Button><Plus className="mr-2 h-4 w-4" /> New Bill</Button>
         </Link>
      </div>

      <div className="rounded-md border bg-white">
        <BillsTable data={JSON.parse(JSON.stringify(bills))} />
      </div>
    </div>
  );
}
