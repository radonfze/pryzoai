import { db } from "@/db";
import { salesInvoices } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import GradientHeader from "@/components/ui/gradient-header";
import { FileText, Plus } from "lucide-react";
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

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="sales"
        title="Sales Invoices"
        description="Track revenue, invoices, and customer payments"
        icon={FileText}
      />
      
      <div className="flex items-center justify-end gap-2">
         <ExportButton data={invoices} filename="Sales_Invoices" />
         <Link href="/sales/invoices/new">
           <Button><Plus className="mr-2 h-4 w-4" /> Create Invoice</Button>
         </Link>
      </div>

      <div className="rounded-md border bg-white">
        <InvoicesTable invoices={invoices} userId={userId} />
      </div>
    </div>
  );
}
