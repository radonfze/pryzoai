import { db } from "@/db";
import { payrollRuns } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Play, Wallet } from "lucide-react";
import GradientHeader from "@/components/ui/gradient-header";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";

export const dynamic = 'force-dynamic';

export default async function PayrollPage() {
  const companyId = "00000000-0000-0000-0000-000000000000";

  let runs: any[] = [];
  try {
     runs = await db.query.payrollRuns.findMany({
      where: eq(payrollRuns.companyId, companyId),
      orderBy: [desc(payrollRuns.createdAt)],
      limit: 50,
    });
  } catch (e) {
      console.error("Failed to fetch payroll runs", e);
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="hr"
        title="Payroll Management"
        description="Process monthly payroll, manage salaries, and track payments"
        icon={Wallet}
      />
      
      <div className="flex items-center justify-end">
        <Link href="/hr/payroll/new">
          <Button><Play className="mr-2 h-4 w-4" /> Run Payroll</Button>
        </Link>
      </div>

      <DataTable 
        columns={columns} 
        data={runs} 
        searchKey="runNumber"
        placeholder="Search payroll runs..." 
      />
    </div>
  );
}
