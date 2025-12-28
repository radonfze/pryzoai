import { db } from "@/db";
import { employees } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, UserCircle } from "lucide-react";
import GradientHeader from "@/components/ui/gradient-header";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";

export const dynamic = 'force-dynamic';

export default async function EmployeesPage() {
  const companyId = "00000000-0000-0000-0000-000000000000";

  const data = await db.query.employees.findMany({
    where: eq(employees.companyId, companyId),
    orderBy: [desc(employees.createdAt)],
  });

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="hr"
        title="Employee Management"
        description="Manage employee records, payroll, and attendance"
        icon={UserCircle}
      />
      
      <div className="flex items-center justify-end">
        <Link href="/hr/employees/new">
          <Button><Plus className="mr-2 h-4 w-4" /> Add Employee</Button>
        </Link>
      </div>

      <DataTable 
        columns={columns} 
        data={data} 
        searchKey="firstName"
        placeholder="Search employees..." 
      />
    </div>
  );
}
