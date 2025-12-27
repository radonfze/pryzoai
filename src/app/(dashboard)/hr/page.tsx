import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, DollarSign, Clock } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function HRPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">HR & Payroll</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Leave Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payroll</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Employees</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/hr/employees" className="block p-2 hover:bg-muted rounded-md transition-colors">
              View All Employees
            </Link>
            <Link href="/hr/employees/new" className="block p-2 hover:bg-muted rounded-md transition-colors">
              + Add Employee
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance & Leave</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/hr/attendance" className="block p-2 hover:bg-muted rounded-md transition-colors">
              Attendance Records
            </Link>
            <Link href="/hr/leave" className="block p-2 hover:bg-muted rounded-md transition-colors">
              Leave Requests
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payroll</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/hr/payroll" className="block p-2 hover:bg-muted rounded-md transition-colors">
              Payroll Runs
            </Link>
            <Link href="/hr/payroll/new" className="block p-2 hover:bg-muted rounded-md transition-colors">
              + Process Payroll
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
