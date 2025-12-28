"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { Banknote } from "lucide-react";
import GradientHeader from "@/components/ui/gradient-header";

export default function NewPayrollPage() {
  const router = useRouter();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <GradientHeader
        module="hr"
        title="Process Payroll"
        description="Create a new payroll run for your employees"
        icon={Banknote}
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Payroll Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
               <label className="text-sm font-medium">Payroll Month *</label>
               <Select>
                    <SelectTrigger><SelectValue placeholder="Select Month" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="jan">January 2025</SelectItem>
                        <SelectItem value="feb">February 2025</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div>
               <label className="text-sm font-medium">Payment Date</label>
               <Input type="date" />
            </div>
          </div>

          <div>
             <label className="text-sm font-medium">Notes</label>
             <Input placeholder="e.g. Standard monthly payroll" />
          </div>

          <div className="bg-muted p-4 rounded-lg">
             <h4 className="font-semibold mb-2">Summary</h4>
             <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Includes Basic Salary</li>
                <li>• Includes Housing Allowance</li>
                <li>• Includes Transport Allowance</li>
                <li>• Auto-calculates deductions based on attendance</li>
             </ul>
          </div>

          <div className="flex gap-4 pt-4">
            <Button>Generate Draft</Button>
            <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
