"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GradientHeader } from "@/components/ui/gradient-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { processPayrollRun } from "@/actions/hr/payroll"; // We need to wrap logic in a server action file

export default function ProcessPayrollPage() {
    const [month, setMonth] = useState<string>(new Date().getMonth() + 1 + ""); // Current Month
    const [year, setYear] = useState<string>(new Date().getFullYear() + "");
    const [loading, setLoading] = useState(false);

    const handleProcess = async () => {
        setLoading(true);
        try {
            const res = await processPayrollRun(Number(month), Number(year));
            if (res.success) {
                toast.success(res.message);
                // Redirect to details
            } else {
                toast.error(res.message);
            }
        } catch (e) {
            toast.error("Process Failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <GradientHeader 
                module="hr"
                title="Process Payroll"
                description="Run monthly payroll engine"
                icon="Banknote"
                backUrl="/hr/payroll"
            />

            <Card className="max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>Select Period</CardTitle>
                    <CardDescription>Generated payroll drafts for review.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-4">
                        <Select value={month} onValueChange={setMonth}>
                            <SelectTrigger>
                                <SelectValue placeholder="Month" />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                                    <SelectItem key={m} value={m.toString()}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={year} onValueChange={setYear}>
                            <SelectTrigger>
                                <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent>
                                {[2024, 2025, 2026].map(y => (
                                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button className="w-full" onClick={handleProcess} disabled={loading}>
                        {loading ? "Processing..." : "Run Payroll Engine"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
