import { db } from "@/db";
import { leaveTransactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Calendar, User, Clock, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import GradientHeader from "@/components/ui/gradient-header";

export const dynamic = 'force-dynamic';

export default async function LeaveDetailPage({ params }: { params: { id: string } }) {
  const leave = await db.query.leaveTransactions.findFirst({
    where: eq(leaveTransactions.id, params.id),
    with: {
        employee: true,
    }
  });

  if (!leave) {
    notFound();
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between no-print">
         <GradientHeader
            module="hr"
            title={`Leave Request: ${leave.requestNumber}`}
            description="View leave details and approval status"
            icon={Calendar}
          />
        <div className="flex gap-2">
            <Link href="/hr/leaves">
                <Button variant="ghost"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
            </Link>
            <Link href={`/hr/leaves/${leave.id}/edit`}>
                 <Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Edit</Button>
            </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Details */}
        <Card className="md:col-span-2">
           <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Leave Details</CardTitle></CardHeader>
           <CardContent className="grid gap-4 md:grid-cols-2">
               <div>
                   <label className="text-sm font-medium text-muted-foreground">Leave Type</label>
                   <p className="text-lg font-medium capitalize">{leave.leaveType}</p>
               </div>
               <div>
                   <label className="text-sm font-medium text-muted-foreground">Duration</label>
                   <p className="text-lg font-medium">{Number(leave.days)} Days</p>
               </div>
               <div>
                   <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                   <p>{format(new Date(leave.startDate), "dd MMM yyyy")}</p>
               </div>
               <div>
                   <label className="text-sm font-medium text-muted-foreground">End Date</label>
                   <p>{format(new Date(leave.endDate), "dd MMM yyyy")}</p>
               </div>
               <div className="md:col-span-2">
                   <label className="text-sm font-medium text-muted-foreground">Reason</label>
                   <p className="mt-1 p-3 bg-muted/50 rounded-md italic">{leave.reason || "No reason provided"}</p>
               </div>
           </CardContent>
        </Card>

        {/* Status & Employee */}
        <div className="space-y-6">
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-4 w-4" /> Employee</CardTitle></CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-1">
                        <span className="font-medium text-lg">{leave.employee?.firstName} {leave.employee?.lastName}</span>
                        <span className="text-sm text-muted-foreground">{leave.employee?.code}</span>
                        <span className="text-sm text-muted-foreground">{leave.employee?.department}</span>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-4 w-4" /> Status</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Current Status</span>
                        <Badge variant={
                            leave.status === 'approved' ? 'default' : 
                            leave.status === 'rejected' ? 'destructive' : 'secondary'
                        } className="text-base px-3 py-1">
                            {leave.status || "Pending"}
                        </Badge>
                    </div>
                    
                    {leave.status === 'pending' && (
                        <div className="flex gap-2 pt-2">
                            <Button className="flex-1 bg-green-600 hover:bg-green-700"><CheckCircle className="mr-2 h-4 w-4" /> Approve</Button>
                            <Button variant="destructive" className="flex-1"><XCircle className="mr-2 h-4 w-4" /> Reject</Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
