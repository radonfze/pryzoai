import { db } from "@/db";
import { salesQuotations } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, FileText, CheckCircle2, Send } from "lucide-react";
import { StatsCards, StatItem } from "@/components/dashboard/stats-cards";
import GradientHeader from "@/components/ui/gradient-header";
import { DataTable } from "@/components/ui/data-table";
import { createColumns } from "./columns";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ExportButton } from "@/components/ui/export-button";

export const dynamic = 'force-dynamic';

export default async function QuotationsPage() {
  const session = await getSession();
  if (!session?.userId) {
    redirect("/login");
  }
  
  const userId = session.userId;
  const companyId = session.companyId || "00000000-0000-0000-0000-000000000000";

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

  // Create columns with user ID for security dialogs
  const columns = createColumns(userId);

  // Calculate Stats (efficient aggregation)
  let statsData = {
    total: 0,
    draft: 0,
    sent: 0,
    accepted: 0
  };

  try {
    const statsResult = await db
      .select({
        status: salesQuotations.status,
        count: count(),
      })
      .from(salesQuotations)
      .where(eq(salesQuotations.companyId, companyId))
      .groupBy(salesQuotations.status);

    statsData = statsResult.reduce((acc, curr) => {
      acc.total += curr.count;
      if (curr.status === 'draft') acc.draft += curr.count;
      if (curr.status === 'sent') acc.sent += curr.count;
      if (curr.status === 'issued') acc.accepted += curr.count; // issued = accepted/processed
      return acc;
    }, { total: 0, draft: 0, sent: 0, accepted: 0 });
  } catch (err) {
    console.error("Failed to fetch quotation stats", err);
  }

  const salesStats: StatItem[] = [
    {
      title: "Total Quotations",
      value: statsData.total,
      icon: FileText,
      description: "All time",
      color: "text-blue-500"
    },
    {
      title: "Drafts",
      value: statsData.draft,
      icon: FileText, // Or Edit
      description: "Pending review",
      color: "text-gray-500"
    },
    {
      title: "Sent",
      value: statsData.sent,
      icon: Send,
      description: "Awaiting response",
      color: "text-orange-500"
    },
    {
      title: "Accepted (Issued)",
      value: statsData.accepted,
      icon: CheckCircle2,
      description: "Converted to orders",
      color: "text-green-500"
    },
  ];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="sales"
        title="Quotations"
        description="Create and send pricing quotes to customers"
        icon={FileText}
      />
      
      <StatsCards stats={salesStats} />

      <div className="flex items-center justify-end gap-2">
        <ExportButton data={specificQuotations} filename="Quotations" />
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
