"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getNextCode } from "@/actions/settings/auto-code";
import { Loader2 } from "lucide-react";

export default function NewEmployeePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(true);
  const [employeeCode, setEmployeeCode] = useState("");

  useEffect(() => {
    async function fetchCode() {
      try {
        // TODO: Add EMP to auto-code types
        setEmployeeCode("EMP-00001");
      } finally {
        setCodeLoading(false);
      }
    }
    fetchCode();
  }, []);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Add New Employee</h2>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Employee Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium">Employee Code</label>
              <div className="relative">
                <Input value={employeeCode} readOnly className="bg-muted pr-8" />
                {codeLoading && <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin" />}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">First Name *</label>
              <Input placeholder="First name" />
            </div>
            <div>
              <label className="text-sm font-medium">Last Name *</label>
              <Input placeholder="Last name" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Email *</label>
              <Input type="email" placeholder="employee@company.com" />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input placeholder="+971 50 XXX XXXX" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium">Department</label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="it">IT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Position</label>
              <Input placeholder="Job title" />
            </div>
            <div>
              <label className="text-sm font-medium">Join Date</label>
              <Input type="date" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Basic Salary</label>
              <Input type="number" placeholder="0.00" step="0.01" />
            </div>
            <div>
              <label className="text-sm font-medium">Emirates ID</label>
              <Input placeholder="784-XXXX-XXXXXXX-X" />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button disabled={loading}>Add Employee</Button>
            <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
