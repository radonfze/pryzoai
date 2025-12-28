import { db } from "@/db";
import { salesQuotations } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import GradientHeader from "@/components/ui/gradient-header";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";

export const dynamic = 'force-dynamic';

export default async function QuotationsPage() {
  const companyId = "00000000-0000-0000-0000-000000000000";

  let specificQuotations: any[] = [];
  try {
     specificQuotations = await db.query.salesQuotations.findMany({
      where: eq(salesQuotations.companyId, companyId),
      orderBy: [desc(salesQuotations.createdAt)],
      with: {
        customer: true,
      },
      limit: 50,
    });
  } catch {
      // Table might not exist
  }

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

      <DataTable 
        columns={columns} 
        data={specificQuotations} 
        searchKey="quotationNumber"
        placeholder="Search quotations..." 
      />
    </div>
  );
}
