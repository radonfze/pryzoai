import { db } from "@/db";
import { employees } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Eye } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function EmployeesPage() {
  const companyId = "00000000-0000-0000-0000-000000000000";

  let employeeList: any[] = [];
  try {
    employeeList = await db.query.employees.findMany({
      where: eq(employees.companyId, companyId),
      orderBy: [desc(employees.createdAt)],
      limit: 50,
    });
  } catch {
    // Table might not exist
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Employees</h2>
        <Link href="/hr/employees/new">
          <Button><Plus className="mr-2 h-4 w-4" /> Add Employee</Button>
        </Link>
      </div>

      {employeeList.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No employees added yet.</p>
          <p className="text-sm mt-2">Add employees to manage payroll and attendance.</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employeeList.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium font-mono">{emp.employeeCode || emp.id.slice(0, 8)}</TableCell>
                  <TableCell>{emp.firstName} {emp.lastName}</TableCell>
                  <TableCell>{emp.department || "-"}</TableCell>
                  <TableCell>{emp.position || "-"}</TableCell>
                  <TableCell>{emp.email || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={emp.isActive ? "default" : "secondary"}>
                      {emp.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`/hr/employees/${emp.id}`}>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
