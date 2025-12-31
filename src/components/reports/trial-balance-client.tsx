"use client";

import { useState, useEffect } from "react";
import { getTrialBalance } from "@/actions/reports/trial-balance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { ExportButton } from "@/components/ui/export-button";
import { Badge } from "@/components/ui/badge";

export default function TrialBalanceClient() {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);
    
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getTrialBalance();
            setData(res);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const totalDebit = data.reduce((sum, item) => sum + item.debit, 0);
    const totalCredit = data.reduce((sum, item) => sum + item.credit, 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

    // Grouping by Type for nicer display
    const groups = ["asset", "liability", "equity", "revenue", "expense"];

    return (
        <div className="space-y-6">
            <Card>
                <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <h3 className="font-semibold text-lg">Financial Position</h3>
                            <div className="flex items-center gap-2">
                                <Badge variant={isBalanced ? "success" : "destructive"}>
                                    {isBalanced ? "Balanced" : "Unbalanced"}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                    Difference: {(totalDebit - totalCredit).toFixed(2)}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                             <Button onClick={fetchData} variant="outline" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                Refresh
                            </Button>
                            <ExportButton data={data} filename="trial_balance" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Code</TableHead>
                                <TableHead>Account Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Debit</TableHead>
                                <TableHead className="text-right">Credit</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {groups.map(type => {
                                const typeAccounts = data.filter(d => d.type === type);
                                if (typeAccounts.length === 0) return null;
                                
                                return (
                                    <>
                                        <TableRow key={type} className="bg-muted/50 hover:bg-muted/50">
                                            <TableCell colSpan={5} className="font-bold uppercase text-xs tracking-wider pl-4">
                                                {type}
                                            </TableCell>
                                        </TableRow>
                                        {typeAccounts.map(acc => (
                                            <TableRow key={acc.id}>
                                                <TableCell className="font-mono text-muted-foreground">{acc.code}</TableCell>
                                                <TableCell>{acc.name}</TableCell>
                                                <TableCell className="capitalize text-xs text-muted-foreground">{acc.group?.replace('_', ' ')}</TableCell>
                                                <TableCell className="text-right font-mono">
                                                    {acc.debit > 0 ? Number(acc.debit).toLocaleString(undefined, {minimumFractionDigits: 2}) : "-"}
                                                </TableCell>
                                                <TableCell className="text-right font-mono">
                                                    {acc.credit > 0 ? Number(acc.credit).toLocaleString(undefined, {minimumFractionDigits: 2}) : "-"}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </>
                                );
                            })}
                            
                            {/* Grand Total */}
                            <TableRow className="bg-muted/20 font-bold border-t-2 border-black">
                                <TableCell colSpan={3} className="text-right">Grand Total</TableCell>
                                <TableCell className="text-right text-base">{totalDebit.toLocaleString(undefined, {minimumFractionDigits: 2})}</TableCell>
                                <TableCell className="text-right text-base">{totalCredit.toLocaleString(undefined, {minimumFractionDigits: 2})}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
