import { db } from "@/db";
import { leaveTransactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Calendar } from "lucide-react";
import GradientHeader from "@/components/ui/gradient-header";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";

export const dynamic = 'force-dynamic';

export default async function LeavesPage() {
  const companyId = "00000000-0000-0000-0000-000000000000";

  let leaves: any[] = [];
  try {
    leaves = await db.query.leaveTransactions.findMany({
      where: eq(leaveTransactions.companyId, companyId),
      orderBy: [desc(leaveTransactions.createdAt)],
      with: {
        employee: true,
      },
      limit: 50,
    });
  } catch (e) {
    console.error("Failed to fetch leaves", e);
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="hr"
        title="Leave Requests"
        description="Manage employee leave requests and approvals"
        icon={Calendar}
      />
      
      <div className="flex items-center justify-end">
        <Link href="/hr/leaves/new">
          <Button><Plus className="mr-2 h-4 w-4" /> New Request</Button>
        </Link>
      </div>

      <DataTable 
        columns={columns} 
        data={leaves} 
        searchKey="employee"
        placeholder="Search employee..." 
      />
    </div>
  );
}
