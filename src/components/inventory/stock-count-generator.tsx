"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";
import { getSnapshotItems, createStockCount } from "@/actions/inventory/stock-count";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { formatCurrency } from "@/lib/utils";

interface StockCountGeneratorProps {
    warehouses: { id: string; name: string }[];
    categories: { id: string; name: string }[];
    brands: { id: string; name: string }[];
}

export function StockCountGenerator({ warehouses, categories, brands }: StockCountGeneratorProps) {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2>(1);
    const [loading, setLoading] = useState(false);
    
    // Step 1 State
    const [warehouseId, setWarehouseId] = useState("");
    const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
    const [brandId, setBrandId] = useState<string | undefined>(undefined);
    const [description, setDescription] = useState("");

    // Step 2 State
    const [snapshot, setSnapshot] = useState<any[]>([]);

    async function handleGenerateSnapshot() {
        if (!warehouseId) {
            toast.error("Please select a warehouse");
            return;
        }
        setLoading(true);
        try {
            const items = await getSnapshotItems(warehouseId, categoryId, brandId);
            setSnapshot(items);
            setStep(2);
            toast.success(`Generated snapshot with ${items.length} items`);
        } catch (error) {
            toast.error("Failed to generate snapshot");
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateCount() {
        setLoading(true);
        try {
            const result = await createStockCount({
                warehouseId,
                description,
                lines: snapshot.map(item => ({
                    itemId: item.itemId,
                    systemQty: parseFloat(item.quantityOnHand),
                }))
            });

            if (result.success) {
                toast.success("Stock Count created successfully");
                router.push(`/inventory/count/${result.id}`);
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Failed to create count");
        } finally {
            setLoading(false);
        }
    }

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: "itemCode",
            header: "Code",
        },
        {
            accessorKey: "itemName",
            header: "Item Name",
        },
        {
            accessorKey: "quantityOnHand",
            header: "Current On Hand",
            cell: ({ row }) => <div className="text-right font-mono">{parseFloat(row.getValue("quantityOnHand")).toFixed(0)}</div>,
        }
    ];

    if (step === 1) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Start New Stock Count</CardTitle>
                    <CardDescription>Select filters to generate a count sheet</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <Label>Warehouse *</Label>
                            <Select value={warehouseId} onValueChange={setWarehouseId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Warehouse" />
                                </SelectTrigger>
                                <SelectContent>
                                    {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Description</Label>
                            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Monthly Count Jan 2026" />
                        </div>
                        <div>
                            <Label>Category (Optional)</Label>
                            <Select value={categoryId} onValueChange={setCategoryId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Brand (Optional)</Label>
                            <Select value={brandId} onValueChange={setBrandId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Brands" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Brands</SelectItem>
                                    {brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button onClick={handleGenerateSnapshot} disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Generate List
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Preview Count Sheet</CardTitle>
                <CardDescription>Review the items to be included in this count ({snapshot.length} items)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="rounded-md border">
                    <DataTable 
                        columns={columns} 
                        data={snapshot} 
                        placeholder="Filter items..."
                        searchKey="itemName"
                    />
                </div>
                <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={() => setStep(1)} disabled={loading}>
                        Back to Filters
                    </Button>
                    <Button onClick={handleCreateCount} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Create Count
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
