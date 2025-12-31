import { db } from "@/db";
import { payrollRuns, payrollDetails } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Wallet, CheckCircle, XCircle, Printer, Download } from "lucide-react";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import GradientHeader from "@/components/ui/gradient-header";

export const dynamic = 'force-dynamic';

export default async function PayrollRunDetailPage({ params }: { params: { id: string } }) {
  const run = await db.query.payrollRuns.findFirst({
    where: eq(payrollRuns.id, params.id),
    with: {
        details: {
            with: {
                employee: true
            }
        }
    }
  });

  if (!run) {
    notFound();
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between no-print">
         <GradientHeader
            module="hr"
            title={`Payroll Run: ${run.runNumber}`}
            description={`Period: ${run.periodMonth}/${run.periodYear}`}
            icon={Wallet}
          />
        <div className="flex gap-2">
            <Link href="/hr/payroll">
                <Button variant="ghost"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
            </Link>
            <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Print</Button>
            <Button variant="outline"><Download className="mr-2 h-4 w-4" /> WPS File</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Summary Details */}
        <Card className="md:col-span-2">
           <CardHeader><CardTitle className="flex items-center gap-2"><Wallet className="h-4 w-4" /> Run Summary</CardTitle></CardHeader>
           <CardContent className="grid gap-4 md:grid-cols-2">
               <div>
                   <label className="text-sm font-medium text-muted-foreground">Run Number</label>
                   <p className="text-lg font-mono">{run.runNumber}</p>
               </div>
               <div>
                   <label className="text-sm font-medium text-muted-foreground">Period</label>
                   <p className="text-lg font-medium">{format(new Date(run.periodYear, run.periodMonth - 1), "MMMM yyyy")}</p>
               </div>
               <div>
                   <label className="text-sm font-medium text-muted-foreground">Run Date</label>
                   <p>{format(new Date(run.runDate), "dd MMM yyyy")}</p>
               </div>
               <div>
                   <label className="text-sm font-medium text-muted-foreground">Status</label>
                   <div className="mt-1">
                       <Badge variant={run.status === 'paid' ? 'default' : run.status === 'approved' ? 'default' : 'secondary'}>
                           {run.status || 'Draft'}
                       </Badge>
                   </div>
               </div>
           </CardContent>
        </Card>

        {/* Totals */}
        <Card>
            <CardHeader><CardTitle>Totals</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Basic</span>
                    <span>{Number(run.totalBasicSalary).toLocaleString()}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">Allowances</span>
                    <span>{Number(run.totalAllowances).toLocaleString()}</span>
                </div>
                 <div className="flex justify-between text-red-600">
                    <span className="text-muted-foreground">Deductions</span>
                    <span>-{Number(run.totalDeductions).toLocaleString()}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Net Pay</span>
                    <span>{Number(run.totalNetPay).toLocaleString()}</span>
                </div>
                {run.status === 'draft' && (
                    <Button className="w-full mt-4 bg-green-600 hover:bg-green-700">
                        <CheckCircle className="mr-2 h-4 w-4" /> Submit for Approval
                    </Button>
                )}
            </CardContent>
        </Card>
      </div>

      <Card>
          <CardHeader><CardTitle>Employee Payslips</CardTitle></CardHeader>
          <CardContent>
                  <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead className="text-right">Basic</TableHead>
                          <TableHead className="text-right">Allowances</TableHead>
                          <TableHead className="text-right">Overtime</TableHead>
                          <TableHead className="text-right">Absence</TableHead>
                          <TableHead className="text-right">Other Ded.</TableHead>
                          <TableHead className="text-right">Net Pay</TableHead>
                          <TableHead className="text-center">Paid</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {run.details.map((detail: any) => (
                          <TableRow key={detail.id}>
                              <TableCell className="font-medium">
                                  {detail.employee?.firstName} {detail.employee?.lastName}
                                  <div className="text-xs text-muted-foreground">{detail.employee?.code}</div>
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">{Number(detail.basicSalary).toLocaleString()}</TableCell>
                              <TableCell className="text-right text-muted-foreground">{Number(detail.totalEarnings - detail.overtime - detail.basicSalary).toLocaleString()}</TableCell>
                              <TableCell className="text-right text-blue-600">+{Number(detail.overtime).toLocaleString()}</TableCell>
                              <TableCell className="text-right text-red-500">-{Number(detail.absenceDeduction).toLocaleString()}</TableCell>
                              <TableCell className="text-right text-red-400">-{Number(detail.totalDeductions - detail.absenceDeduction).toLocaleString()}</TableCell>
                              <TableCell className="text-right font-bold">{Number(detail.netPay).toLocaleString()}</TableCell>
                              <TableCell className="text-center">
                                  {detail.isPaid ? 
                                    <CheckCircle className="h-4 w-4 mx-auto text-green-500" /> : 
                                    <XCircle className="h-4 w-4 mx-auto text-gray-300" />
                                  }
                              </TableCell>
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
          </CardContent>
      </Card>
    </div>
  );
}
