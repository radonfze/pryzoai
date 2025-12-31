"use client";

import { useState, useEffect } from "react";
import { getSalesRegister, SalesRegisterParams } from "@/actions/reports/sales-register";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExportButton } from "@/components/ui/export-button";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { Loader2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SalesRegisterClient() {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [totals, setTotals] = useState<any>({ totalAmount: 0, taxAmount: 0, subtotal: 0 });
    
    // Defaults: Current Month
    const [filters, setFilters] = useState<SalesRegisterParams>({
        startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
        endDate: format(endOfMonth(new Date()), "yyyy-MM-dd"),
        status: "all"
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getSalesRegister(filters);
            setData(res.data);
            setTotals(res.totals);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch on mount and filter change (could add debounce or search button)
    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="space-y-6">
            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input 
                                type="date" 
                                value={filters.startDate} 
                                onChange={(e) => setFilters({...filters, startDate: e.target.value})} 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>End Date</Label>
                            <Input 
                                type="date" 
                                value={filters.endDate} 
                                onChange={(e) => setFilters({...filters, endDate: e.target.value})} 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select 
                                value={filters.status} 
                                onValueChange={(val) => setFilters({...filters, status: val})}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="posted_only">Posted Only</SelectItem>
                                    <SelectItem value="issued">Issued</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={fetchData} disabled={loading} className="flex-1">
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                                Generate
                            </Button>
                            <ExportButton data={data} filename="sales_register" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totals.totalAmount.toLocaleString()} AED</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tax Amount</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totals.taxAmount.toLocaleString()} AED</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Invoices</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Invoice #</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Subtotal</TableHead>
                                <TableHead className="text-right">Tax</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                        No records found for this period.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.map((inv) => (
                                    <TableRow key={inv.id}>
                                        <TableCell>{format(new Date(inv.invoiceDate), "dd MMM yyyy")}</TableCell>
                                        <TableCell className="font-mono">{inv.invoiceNumber}</TableCell>
                                        <TableCell>{inv.customer?.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="uppercase text-[10px]">
                                                {inv.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{Number(inv.subtotal).toLocaleString()}</TableCell>
                                        <TableCell className="text-right">{Number(inv.taxAmount).toLocaleString()}</TableCell>
                                        <TableCell className="text-right font-bold">{Number(inv.totalAmount).toLocaleString()}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
