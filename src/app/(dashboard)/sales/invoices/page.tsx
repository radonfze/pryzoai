import { db } from "@/db";
import { salesInvoices } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import GradientHeader from "@/components/ui/gradient-header";
import { FileText, Plus, CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react";
import { StatsCards } from "@/components/dashboard/stats-cards";
import Link from "next/link";
import { ExportButton } from "@/components/ui/export-button";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { InvoicesTable } from "./invoices-table";

export const dynamic = 'force-dynamic';

export default async function InvoicesPage() {
  const session = await getSession();
  if (!session?.userId) {
    redirect("/login");
  }
  
  const userId = session.userId;

  // Fetch all invoices (limit 50 for MVP)
  let invoices = [];
  try {
    invoices = await db.query.salesInvoices.findMany({
      with: {
        customer: true
      },
      orderBy: [desc(salesInvoices.createdAt)],
      limit: 50
    });
  } catch (error) {
    console.error("CRITICAL ERROR: Failed to fetch invoices:", error);
    invoices = [];
  }

  // Calculate Stats
  let statsData = {
    totalRevenue: 0,
    pendingPayment: 0,
    overdue: 0,
    drafts: 0
  };

  try {
      // We can use a raw SQL query or just fetch all lightweight status/amount objects for cleaner logic if distinct count is low, 
      // but let's try a grouped query. Ideally we sum amounts.
      const statsList = await db
        .select({
            status: salesInvoices.status,
            totalAmount: salesInvoices.totalAmount,
            balanceAmount: salesInvoices.balanceAmount,
            dueDate: salesInvoices.dueDate
        })
        .from(salesInvoices)
        .where(eq(salesInvoices.companyId, userId ? (session.companyId || "00000000-0000-0000-0000-000000000000") : "00000000-0000-0000-0000-000000000000"));
        
      const now = new Date();
      
      statsList.forEach(inv => {
         const amount = Number(inv.totalAmount || 0);
         const balance = Number(inv.balanceAmount || 0);
         
         if (inv.status === 'posted' || inv.status === 'completed' || inv.status === 'paid') { // valid revenue
             statsData.totalRevenue += amount;
         }
         
         if (balance > 0 && inv.status !== 'draft' && inv.status !== 'cancelled') {
             statsData.pendingPayment += balance;
             const due = new Date(inv.dueDate);
             if (due < now) {
                 statsData.overdue += balance;
             }
         }

         if (inv.status === 'draft') {
             statsData.drafts++;
         }
      });

  } catch (err) {
      console.error("Failed to fetch invoice stats", err);
  }

  const invoiceStats: any[] = [
    {
       title: "Total Revenue",
       value: new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(statsData.totalRevenue),
       icon: CheckCircle2,
       description: "Posted & Paid Invoices",
       color: "text-green-600"
    },
    {
       title: "Pending Payment",
       value: new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(statsData.pendingPayment),
       icon: AlertCircle,
       description: "Outstanding Balance",
       color: "text-orange-500"
    },
    {
       title: "Overdue",
       value: new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(statsData.overdue),
       icon: AlertTriangle,
       description: "Past Due Date",
       color: "text-red-500"
    },
    {
       title: "Draft Invoices",
       value: statsData.drafts,
       icon: FileText,
       description: "Not issued yet",
       color: "text-gray-500"
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="sales"
        title="Sales Invoices"
        description="Track revenue, invoices, and customer payments"
        icon={FileText}
      />
      
      <StatsCards stats={invoiceStats} />

      <div className="flex items-center justify-end gap-2">
         <ExportButton data={invoices} filename="Sales_Invoices" />
         <Link href="/sales/invoices/new">
           <Button><Plus className="mr-2 h-4 w-4" /> Create Invoice</Button>
         </Link>
      </div>

      <div className="rounded-md border bg-white">
        <InvoicesTable invoices={JSON.parse(JSON.stringify(invoices))} userId={userId} />
      </div>
    </div>
  );
}
