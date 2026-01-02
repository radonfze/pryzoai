"use client";

import { useState, useMemo } from "react";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, Edit, Trash2, RotateCcw } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { deleteStockCount, revokeStockCount } from "@/actions/inventory/stock-count";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface StockCountListProps {
    data: any[];
    permissions?: string[];
}

export function StockCountList({ data, permissions = [] }: StockCountListProps) {
    const router = useRouter();
    const [actionId, setActionId] = useState<string | null>(null);
    const [actionType, setActionType] = useState<"delete" | "revoke" | null>(null);
    const [loading, setLoading] = useState(false);

    const canEdit = permissions.includes("inventory.count.edit");
    const canRevoke = permissions.includes("inventory.count.revoke");
    const canView = true; // Always true if here

    const handleAction = async () => {
        if (!actionId || !actionType) return;
        setLoading(true);
        try {
            let result;
            if (actionType === "delete") {
                result = await deleteStockCount(actionId);
            } else {
                result = await revokeStockCount(actionId);
            }

            if (result.success) {
                toast.success(result.message);
                router.refresh();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Operation failed");
        } finally {
            setLoading(false);
            setActionId(null);
            setActionType(null);
        }
    };

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: "countNumber",
            header: "Count #",
            cell: ({ row }) => <span className="font-mono text-xs">{row.getValue("countNumber")}</span>
        },
        {
            accessorKey: "countDate",
            header: "Date",
            cell: ({ row }) => formatDate(row.getValue("countDate")),
        },
        {
            accessorKey: "warehouse.name",
            header: "Warehouse",
        },
        {
            accessorKey: "description",
            header: "Description",
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.getValue("status") as string;
                const colors: any = {
                    draft: "bg-gray-100 text-gray-700",
                    in_progress: "bg-blue-100 text-blue-700",
                    completed: "bg-green-100 text-green-700",
                    cancelled: "bg-red-100 text-red-700",
                };
                return <Badge className={colors[status] || "bg-gray-100"} variant="outline">{status.replace('_', ' ').toUpperCase()}</Badge>;
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const item = row.original;
                const isDraft = item.status === "draft";
                const isPosted = item.isPosted;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <Link href={`/inventory/count/${item.id}`}>
                                <DropdownMenuItem>
                                    <Eye className="mr-2 h-4 w-4" /> View Details
                                </DropdownMenuItem>
                            </Link>
                            
                            {isDraft && canEdit && (
                                <Link href={`/inventory/count/${item.id}`}>
                                    <DropdownMenuItem>
                                        <Edit className="mr-2 h-4 w-4" /> Edit / Count
                                    </DropdownMenuItem>
                                </Link>
                            )}

                            {isDraft && canEdit && (
                                <DropdownMenuItem onClick={() => { setActionId(item.id); setActionType("delete"); }} className="text-red-600">
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                            )}

                            {isPosted && canRevoke && item.status !== "cancelled" && (
                                <DropdownMenuItem onClick={() => { setActionId(item.id); setActionType("revoke"); }} className="text-amber-600">
                                    <RotateCcw className="mr-2 h-4 w-4" /> Revoke (Reversal)
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            }
        }
    ];

    return (
        <>
            <div className="rounded-md border">
                <DataTable
                    columns={columns}
                    data={data}
                    searchKey="description"
                    placeholder="Search counts..."
                />
            </div>

            <AlertDialog open={!!actionId} onOpenChange={(open) => !open && setActionId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{actionType === "delete" ? "Delete Draft Count?" : "Revoke Posted Count?"}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {actionType === "delete" 
                                ? "This will permanently delete the draft count. This action cannot be undone."
                                : "This will create reversal transactions for all adjustments made by this count. Inventory will be reverted."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleAction} disabled={loading} className={actionType === "delete" ? "bg-red-600" : "bg-amber-600"}>
                            {loading ? "Processing..." : "Confirm"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
