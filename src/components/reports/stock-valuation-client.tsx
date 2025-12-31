"use client";

import { useState, useEffect } from "react";
import { getStockValuation, StockValuationParams } from "@/actions/reports/stock-valuation";
import { getWarehouseOptions } from "@/actions/settings/get-warehouse-options";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExportButton } from "@/components/ui/export-button";
import { Loader2, Search, CheckSquare, Square } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function StockValuationClient() {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [totals, setTotals] = useState<any>({ totalValue: 0, totalItems: 0, totalQty: 0 });
    const [warehouses, setWarehouses] = useState<any[]>([]);
    
    const [filters, setFilters] = useState<StockValuationParams>({
        warehouseId: "all",
        hideZeroStock: true
    });

    // Load initial data
    useEffect(() => {
        const loadInit = async () => {
             const wh = await getWarehouseOptions();
             setWarehouses(wh);
             fetchData(); // Load default on mount
        };
        loadInit();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getStockValuation(filters);
            setData(res.data);
            setTotals(res.totals);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="space-y-2 w-[250px]">
                            <Label>Warehouse</Label>
                            <Select 
                                value={filters.warehouseId} 
                                onValueChange={(val) => setFilters({...filters, warehouseId: val})}
                            >
                                <SelectTrigger><SelectValue placeholder="All Warehouses" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Warehouses</SelectItem>
                                    {warehouses.map(w => (
                                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2 pb-2">
                             <Switch 
                                checked={filters.hideZeroStock}
                                onCheckedChange={(checked) => setFilters({...filters, hideZeroStock: checked})}
                             />
                             <Label>Hide Zero Stock</Label>
                        </div>

                        <div className="flex gap-2 ml-auto">
                            <Button onClick={fetchData} disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                                Update Report
                            </Button>
                            <ExportButton data={data} filename="stock_valuation" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Summary */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{totals.totalValue.toLocaleString()} AED</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Distinct Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totals.totalItems}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totals.totalQty.toLocaleString()}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item Code</TableHead>
                                <TableHead>Item Name</TableHead>
                                <TableHead>Warehouse</TableHead>
                                <TableHead className="text-right">Qty</TableHead>
                                <TableHead className="text-right">Avg Cost</TableHead>
                                <TableHead className="text-right">Total Value</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                        No stock records found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell className="font-mono text-sm">{row.item?.code}</TableCell>
                                        <TableCell>{row.item?.name}</TableCell>
                                        <TableCell>{row.warehouse?.name}</TableCell>
                                        <TableCell className="text-right font-medium">{Number(row.quantityOnHand).toLocaleString()}</TableCell>
                                        <TableCell className="text-right text-muted-foreground">{Number(row.averageCost).toLocaleString()}</TableCell>
                                        <TableCell className="text-right font-bold">{Number(row.totalValue).toLocaleString()}</TableCell>
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
