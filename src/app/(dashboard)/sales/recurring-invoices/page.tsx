import { db } from "@/db";
import { recurringInvoiceTemplates } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import GradientHeader from "@/components/ui/gradient-header";
import { Calendar, Plus } from "lucide-react";
import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function RecurringInvoicesPage() {
  const session = await getSession();
  if (!session?.userId) {
    redirect("/login");
  }

  const templates = await db.query.recurringInvoiceTemplates.findMany({
    with: {
        customer: true,
    },
    orderBy: [desc(recurringInvoiceTemplates.createdAt)],
  });

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="sales"
        title="Recurring Invoices"
        description="Manage automated invoice templates and schedules"
        icon={Calendar}
      />
      
      <div className="flex items-center justify-end gap-2">
         <Link href="/sales/recurring-invoices/new">
           <Button><Plus className="mr-2 h-4 w-4" /> Create Template</Button>
         </Link>
      </div>

      <div className="rounded-md border bg-white">
        <DataTable 
          columns={columns} 
          data={templates} 
          searchKey="templateName"
          placeholder="Search templates..." 
        />
      </div>
    </div>
  );
}
