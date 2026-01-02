"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { updateStockCount, postStockCount } from "@/actions/inventory/stock-count";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { formatCurrency } from "@/lib/utils";
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle, 
    AlertDialogTrigger 
} from "@/components/ui/alert-dialog";

interface StockCountSheetProps {
    count: any; // Header
    lines: any[]; // Items
    permissions?: string[];
}

export function StockCountSheet({ count, lines: initialLines, permissions = [] }: StockCountSheetProps) {
    const router = useRouter();
    const [lines, setLines] = useState(initialLines.map(l => ({
        ...l,
        countedQty: parseFloat(l.countedQty),
        systemQty: parseFloat(l.systemQty),
        varianceQty: parseFloat(l.varianceQty),
    })));
    const [loading, setLoading] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    
    // Status Logic
    const isPosted = count.isPosted;
    const canEdit = !isPosted && permissions.includes('inventory.count.edit');
    const canApprove = !isPosted && permissions.includes('inventory.count.approve');

    function handleQtyChange(itemId: string, qtyStr: string) {
        const qty = parseFloat(qtyStr) || 0;
        setLines(prev => prev.map(l => {
            if (l.itemId === itemId) {
                return {
                    ...l,
                    countedQty: qty,
                    varianceQty: qty - l.systemQty 
                };
            }
            return l;
        }));
        setIsDirty(true);
    }

    async function handleSave() {
        setLoading(true);
        try {
            // Only send changed lines or all? Sending all for simplicity in this version
            const payload = lines.map(l => ({
                itemId: l.itemId,
                countedQty: l.countedQty
            }));
            
            const result = await updateStockCount(count.id, payload);
            if (result.success) {
                toast.success("Progress saved");
                setIsDirty(false);
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Failed to save");
        } finally {
            setLoading(false);
        }
    }

    async function handlePost() {
        // Auto save first?
        if (isDirty) {
            toast.error("Please save changes before posting");
            return;
        }

        setLoading(true);
        try {
            const result = await postStockCount(count.id);
            if (result.success) {
                toast.success("Count Posted Successfully");
                router.refresh();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Failed to post count");
        } finally {
            setLoading(false);
        }
    }

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: "item.code",
            header: "Code",
            cell: ({ row }) => <span className="font-mono text-xs">{row.original.item.code}</span>
        },
        {
            accessorKey: "item.name",
            header: "Item Name",
        },
        {
            accessorKey: "systemQty",
            header: "System Qty",
            cell: ({ row }) => <div className="text-right text-muted-foreground">{row.original.systemQty.toFixed(0)}</div>,
        },
        {
            accessorKey: "countedQty",
            header: "Counted Qty",
            cell: ({ row }) => {
                const line = row.original;
                if (!canEdit) {
                    return <div className="text-right font-medium">{line.countedQty.toFixed(0)}</div>
                }
                return (
                    <Input 
                        type="number" 
                        value={line.countedQty} 
                        onChange={(e) => handleQtyChange(line.itemId, e.target.value)}
                        className="text-right h-8 w-24 ml-auto"
                    />
                )
            }
        },
        {
            accessorKey: "varianceQty",
            header: "Variance",
            cell: ({ row }) => {
                const variance = row.original.varianceQty;
                const isZero = variance === 0;
                return (
                    <div className={`text-right font-bold ${isZero ? "text-muted-foreground" : variance < 0 ? "text-red-500" : "text-green-500"}`}>
                        {variance > 0 && "+"}{variance.toFixed(0)}
                    </div>
                )
            }
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{count.countNumber}</h2>
                    <p className="text-muted-foreground">{count.description || 'No description'}</p>
                </div>
                <div className="flex gap-2 items-center">
                    <Badge variant={isPosted ? "default" : "secondary"}>
                        {count.status.toUpperCase().replace('_', ' ')}
                    </Badge>
                    
                    {/* Action Buttons */}
                    {canEdit && (
                        <Button variant="outline" onClick={handleSave} disabled={loading} className={isDirty ? "border-amber-500 text-amber-600" : ""}>
                            <Save className="mr-2 h-4 w-4" />
                            {isDirty ? "Save Unsaved Changes" : "Save Progress"}
                        </Button>
                    )}

                    {canApprove && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button disabled={loading || isDirty}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Post & Adjust Inventory
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will finalize the stock count and create inventory adjustments for any variances. 
                                        This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handlePost}>Continue</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <DataTable 
                        columns={columns} 
                        data={lines} 
                        placeholder="Search items..."
                        searchKey="item.name"
                        meta={{ permissions }}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
