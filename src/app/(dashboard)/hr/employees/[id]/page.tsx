import { db } from "@/db";
import { employees } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, UserCircle, Briefcase, Calendar, MapPin, Mail, Phone } from "lucide-react";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import GradientHeader from "@/components/ui/gradient-header";

export const dynamic = 'force-dynamic';

export default async function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const employee = await db.query.employees.findFirst({
    where: eq(employees.id, params.id),
  });

  if (!employee) {
    notFound();
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between no-print">
         <GradientHeader
            module="hr"
            title={`${employee.firstName} ${employee.lastName}`}
            description="View employee profile and employment details"
            icon={UserCircle}
          />
        <div className="flex gap-2">
            <Link href="/hr/employees">
                <Button variant="ghost"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
            </Link>
            <Link href={`/hr/employees/${employee.id}/edit`}>
                 <Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Edit Profile</Button>
            </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Personal Details */}
        <Card className="md:col-span-2">
           <CardHeader><CardTitle className="flex items-center gap-2"><UserCircle className="h-4 w-4" /> Personal Information</CardTitle></CardHeader>
           <CardContent className="grid gap-4 md:grid-cols-2">
               <div>
                   <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                   <p className="text-lg font-medium">{employee.firstName} {employee.lastName}</p>
                   <p className="text-sm text-gray-500">{employee.firstNameAr} {employee.lastNameAr}</p>
               </div>
               <div>
                   <label className="text-sm font-medium text-muted-foreground">Employee Code</label>
                   <p className="text-lg font-mono">{employee.code}</p>
               </div>
               <div>
                   <label className="text-sm font-medium text-muted-foreground">Gender</label>
                   <p className="capitalize">{employee.gender || "-"}</p>
               </div>
               <div>
                   <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                   <p>{employee.dateOfBirth ? format(new Date(employee.dateOfBirth), "dd MMM yyyy") : "-"}</p>
               </div>
               <div>
                   <label className="text-sm font-medium text-muted-foreground">Nationality</label>
                   <p>{employee.nationality || "-"}</p>
               </div>
               <div>
                   <label className="text-sm font-medium text-muted-foreground">Status</label>
                   <div className="mt-1">
                       <Badge variant={employee.isActive ? 'default' : 'destructive'}>
                           {employee.status || 'Active'}
                       </Badge>
                   </div>
               </div>
           </CardContent>
        </Card>

        {/* Contact Info */}
        <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Phone className="h-4 w-4" /> Contact</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground flex items-center gap-2"><Mail className="h-3 w-3" /> Email</span>
                    <span>{employee.email || "-"}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground flex items-center gap-2"><Phone className="h-3 w-3" /> Phone</span>
                    <span>{employee.phone || "-"}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground flex items-center gap-2"><MapPin className="h-3 w-3" /> Address</span>
                    <span>{employee.address || "-"}</span>
                </div>
            </CardContent>
        </Card>

        {/* Employment Details */}
        <Card className="md:col-span-2">
             <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="h-4 w-4" /> Employment Details</CardTitle></CardHeader>
             <CardContent className="grid gap-4 md:grid-cols-2">
                 <div>
                     <label className="text-sm font-medium text-muted-foreground">Department</label>
                     <p className="font-medium">{employee.department || "-"}</p>
                 </div>
                 <div>
                     <label className="text-sm font-medium text-muted-foreground">Designation</label>
                     <p className="font-medium">{employee.designation || "-"}</p>
                 </div>
                 <div>
                     <label className="text-sm font-medium text-muted-foreground">Joining Date</label>
                     <p>{employee.joiningDate ? format(new Date(employee.joiningDate), "dd MMM yyyy") : "-"}</p>
                 </div>
                 <div>
                     <label className="text-sm font-medium text-muted-foreground">Probation End</label>
                     <p>{employee.probationEndDate ? format(new Date(employee.probationEndDate), "dd MMM yyyy") : "Completed"}</p>
                 </div>
             </CardContent>
        </Card>

        {/* Salary */}
        <Card>
            <CardHeader><CardTitle className="flex items-center gap-2">💰 Compensation</CardTitle></CardHeader>
            <CardContent className="space-y-2">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Basic Salary</span>
                    <span className="font-mono font-medium">{Number(employee.basicSalary || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Housing</span>
                    <span className="font-mono">{Number(employee.housingAllowance || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Transport</span>
                    <span className="font-mono">{Number(employee.transportAllowance || 0).toLocaleString()}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold">
                    <span>Total Salary</span>
                    <span>AED {(
                        Number(employee.basicSalary || 0) + 
                        Number(employee.housingAllowance || 0) + 
                        Number(employee.transportAllowance || 0) +
                        Number(employee.otherAllowance || 0)
                    ).toLocaleString()}</span>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
