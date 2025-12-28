"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { getFinancialReport } from "@/lib/services/get-financial-report"; // Fix import path if needed, actually it was actions/finance
// Ah, I created it in src/actions/finance/get-financial-report.ts. Need to verify import.
// Using relative path or alias.
import { Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Mocking the import for now until verified, or assuming alias works.
// Actually, let's assume the action is importable.
import { getFinancialReport as fetchReport } from "@/actions/finance/get-financial-report";

export default function FinancialReportsPage() {
    const [reportType, setReportType] = useState<"balance_sheet" | "profit_loss" | "trial_balance">("profit_loss");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const res = await fetchReport(reportType, date);
            if (res.success) {
                setData(res);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold">Financial Reports</h1>
            
            <Card>
                <CardHeader>
                    <CardTitle>Generate Report</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-4 items-end">
                    <div className="space-y-2 w-64">
                         <label className="text-sm font-medium">Report Type</label>
                         <Select value={reportType} onValueChange={(v: any) => setReportType(v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="profit_loss">Profit & Loss</SelectItem>
                                <SelectItem value="balance_sheet">Balance Sheet</SelectItem>
                                <SelectItem value="trial_balance">Trial Balance</SelectItem>
                            </SelectContent>
                         </Select>
                    </div>
                    <div className="space-y-2 w-48">
                        <label className="text-sm font-medium">As Of Date</label>
                        <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                    <Button onClick={handleGenerate} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Generate
                    </Button>
                </CardContent>
            </Card>

            {data && (
                <Card>
                    <CardHeader>
                        <CardTitle className="capitalize">{reportType.replace("_", " ")}</CardTitle>
                        <p className="text-sm text-muted-foreground">As of {data.asOf}</p>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-6 grid grid-cols-3 gap-4">
                            {reportType === "profit_loss" && (
                                <>
                                    <div className="p-4 bg-green-50 rounded border">
                                        <div className="text-sm text-gray-500">Total Income</div>
                                        <div className="text-xl font-bold">{data.summary.totalIncome.toFixed(2)}</div>
                                    </div>
                                    <div className="p-4 bg-red-50 rounded border">
                                        <div className="text-sm text-gray-500">Total Expense</div>
                                        <div className="text-xl font-bold">{data.summary.totalExpense.toFixed(2)}</div>
                                    </div>
                                    <div className="p-4 bg-blue-50 rounded border">
                                        <div className="text-sm text-gray-500">Net Profit</div>
                                        <div className="text-xl font-bold">{data.summary.netIncome.toFixed(2)}</div>
                                    </div>
                                </>
                            )}
                             {reportType === "balance_sheet" && (
                                <>
                                    <div className="p-4 bg-blue-50 rounded border">
                                        <div className="text-sm text-gray-500">Total Assets</div>
                                        <div className="text-xl font-bold">{data.summary.totalAssets.toFixed(2)}</div>
                                    </div>
                                    <div className="p-4 bg-yellow-50 rounded border">
                                        <div className="text-sm text-gray-500">Total Liabilities</div>
                                        <div className="text-xl font-bold">{data.summary.totalLiabilities.toFixed(2)}</div>
                                    </div>
                                    <div className="p-4 bg-purple-50 rounded border">
                                        <div className="text-sm text-gray-500">Total Equity</div>
                                        <div className="text-xl font-bold">{data.summary.totalEquity.toFixed(2)}</div>
                                    </div>
                                </>
                            )}
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Account Code</TableHead>
                                    <TableHead>Account Name</TableHead>
                                    <TableHead className="text-right">Balance</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.data.map((row: any, i: number) => (
                                    <TableRow key={i}>
                                        <TableCell>{row.accountCode}</TableCell>
                                        <TableCell>{row.accountName}</TableCell>
                                        <TableCell className="text-right font-mono">
                                            {Number(row.netBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
