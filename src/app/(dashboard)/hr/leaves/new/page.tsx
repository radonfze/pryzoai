import { db } from "@/db";
import { employees } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { LeaveRequestForm } from "@/components/hr/leave-request-form";
import GradientHeader from "@/components/ui/gradient-header";
import { CalendarDays } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function NewLeavePage() {
  const companyId = "00000000-0000-0000-0000-000000000000";

  const employeeList = await db.query.employees.findMany({
    where: and(eq(employees.companyId, companyId), eq(employees.status, 'active')),
    columns: { id: true, firstName: true, lastName: true, employeeCode: true }
  });

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="hr"
        title="New Leave Request"
        description="Submit a leave application for approval"
        icon={CalendarDays}
      />
      <LeaveRequestForm employees={employeeList} />
    </div>
  );
}
