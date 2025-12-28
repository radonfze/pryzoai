import { db } from "@/db";
import { leaveTransactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Eye } from "lucide-react";
import GradientHeader from "@/components/ui/gradient-header";
import { format } from "date-fns";

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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Request #</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaves.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                  No leave requests found.
                </TableCell>
              </TableRow>
            ) : (
              leaves.map((leave) => (
                <TableRow key={leave.id}>
                  <TableCell className="font-medium font-mono">{leave.requestNumber}</TableCell>
                  <TableCell>{leave.employee?.firstName} {leave.employee?.lastName}</TableCell>
                  <TableCell className="capitalize">{leave.leaveType}</TableCell>
                  <TableCell>
                    {format(new Date(leave.startDate), "dd MMM")} - {format(new Date(leave.endDate), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell>{Number(leave.days)}</TableCell>
                  <TableCell>
                    <Badge variant={
                      leave.status === 'approved' ? 'default' : 
                      leave.status === 'rejected' ? 'destructive' : 'secondary'
                    }>
                      {leave.status || "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`/hr/leaves/${leave.id}`}>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
