"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCustomerStatement } from "@/actions/sales/get-customer-statement";
import { Loader2, Printer } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { useSearchParams } from "next/navigation";

// Simplified for V120: We assume a customer ID is passed or we provide a text input for ID.
// Ideally usage of a Combobox to select customer. Using Input (ID) for speed/stub.

export default function CustomerStatementPage() {
    const [customerId, setCustomerId] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        if(!customerId || !startDate || !endDate) return;
        setLoading(true);
        try {
            const res = await getCustomerStatement(customerId, startDate, endDate);
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
            <div className="flex justify-between">
                <h1 className="text-3xl font-bold">Customer Statement</h1>
                <Button variant="outline" onClick={() => window.print()}>
                    <Printer className="mr-2 h-4 w-4" /> Print
                </Button>
            </div>
            
            <Card className="no-print">
                <CardHeader>
                    <CardTitle>Filter Parameters</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-4 items-end">
                    <div className="space-y-2 w-64">
                         <label className="text-sm font-medium">Customer ID</label>
                         <Input value={customerId} onChange={e => setCustomerId(e.target.value)} placeholder="UUID..." />
                    </div>
                    <div className="space-y-2 w-48">
                        <label className="text-sm font-medium">Start Date</label>
                        <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                     <div className="space-y-2 w-48">
                        <label className="text-sm font-medium">End Date</label>
                        <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                    <Button onClick={handleGenerate} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Run Report
                    </Button>
                </CardContent>
            </Card>

            {data && (
                <Card className="print-safe">
                    <CardHeader className="text-center border-b">
                        <h2 className="text-2xl font-bold uppercase tracking-wide">Statement of Account</h2>
                        <p className="text-lg font-semibold">{data.customer.name}</p>
                        <p className="text-sm text-muted-foreground">
                            Period: {format(new Date(data.period.startDate), "dd MMM yyyy")} to {format(new Date(data.period.endDate), "dd MMM yyyy")}
                        </p>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Transaction</TableHead>
                                    <TableHead>Reference</TableHead>
                                    <TableHead className="text-right">Debit</TableHead>
                                    <TableHead className="text-right">Credit</TableHead>
                                    <TableHead className="text-right">Balance</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow className="bg-muted/50 font-medium">
                                    <TableCell colSpan={5}>Opening Balance</TableCell>
                                    <TableCell className="text-right">{Number(data.openiningBalance).toFixed(2)}</TableCell>
                                </TableRow>
                                {data.lines.map((getRow: any, i: number) => (
                                    <TableRow key={i}>
                                        <TableCell>{format(new Date(getRow.date), "dd/MM/yyyy")}</TableCell>
                                        <TableCell>{getRow.type}</TableCell>
                                        <TableCell>{getRow.reference}</TableCell>
                                        <TableCell className="text-right">{getRow.debit > 0 ? getRow.debit.toFixed(2) : "-"}</TableCell>
                                        <TableCell className="text-right">{getRow.credit > 0 ? getRow.credit.toFixed(2) : "-"}</TableCell>
                                        <TableCell className="text-right font-mono">{getRow.balance.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow className="border-t-2 font-bold text-lg">
                                    <TableCell colSpan={5} className="text-right">Closing Balance</TableCell>
                                    <TableCell className="text-right">{Number(data.closingBalance).toFixed(2)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
