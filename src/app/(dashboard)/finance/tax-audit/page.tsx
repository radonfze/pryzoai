"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateFtaAuditFile } from "@/lib/services/tax-export";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function TaxAuditPage() {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleExport = async () => {
        if (!startDate || !endDate) {
            toast.error("Please select both start and end dates");
            return;
        }

        try {
            setIsLoading(true);
            const result = await generateFtaAuditFile(startDate, endDate);

            if (result.success && result.data && result.fileName) {
                // Trigger download
                const blob = new Blob([result.data], { type: "text/csv" });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = result.fileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                toast.success("Audit File Generated Successfully");
            } else {
                toast.error(result.message || "Failed to generate audit file");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Tax Audit Export</h1>
            
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>UAE FTA VAT Audit File (FAF)</CardTitle>
                        <CardDescription>
                            Generate the standard Federal Tax Authority (FTA) Audit File for a specific tax period.
                            This file includes all taxable transactions, standard rated supplies, and input tax recoveries.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="start-date">Start Date</Label>
                                <Input 
                                    id="start-date" 
                                    type="date" 
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end-date">End Date</Label>
                                <Input 
                                    id="end-date" 
                                    type="date" 
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <Button 
                            className="w-full" 
                            onClick={handleExport}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Download className="mr-2 h-4 w-4" />
                                    Generate FAF File (CSV)
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Compliance Information</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground space-y-2">
                        <p>
                            • The generated file follows the FTA Tax Accounting Software Guide structure.
                        </p>
                        <p>
                            • Ensure all invoices and bills for the period are "Posted" before generating.
                        </p>
                        <p>
                            • This export includes: Sales Invoices, Purchase Bills, Credit Notes, and Debit Notes.
                        </p>
                        <p className="font-semibold text-amber-600">
                            Note: Always verify the generated data against your submitted VAT Return before sharing with the FTA.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
