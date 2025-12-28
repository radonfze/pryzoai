"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { Download, Trash2 } from "lucide-react";

// Enhanced Data Table Wrapper with Selection & Export
export function DataTable({ columns, data, onBulkDelete, exportName = "export" }: any) {
    const [selected, setSelected] = useState<string[]>([]);
    
    // Derived state
    const allIds = data.map((d: any) => d.id);
    const isAllSelected = selected.length === allIds.length && allIds.length > 0;
    
    const toggleSelect = (id: string) => {
        if (selected.includes(id)) setSelected(selected.filter(s => s !== id));
        else setSelected([...selected, id]);
    };
    
    const toggleAll = () => {
        if (isAllSelected) setSelected([]);
        else setSelected(allIds);
    };
    
    const handleExport = () => {
        // Simple CSV Export Logic
        const headers = columns.map((c: any) => c.header).join(",");
        const rows = data.map((row: any) => columns.map((c: any) => {
            const val = row[c.accessorKey] || "";
            return `"${val}"`;
        }).join(","));
        
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
        const link = document.createElement("a");
        link.href = encodeURI(csvContent);
        link.setAttribute("download", `${exportName}_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex justify-between items-center bg-gray-50 p-2 rounded border">
                <div className="flex items-center gap-2">
                     <Checkbox checked={isAllSelected} onCheckedChange={toggleAll} />
                     <span className="text-sm font-medium">{selected.length} Selected</span>
                     {selected.length > 0 && onBulkDelete && (
                         <Button variant="destructive" size="sm" onClick={() => onBulkDelete(selected)}>
                             <Trash2 className="h-4 w-4 mr-2" /> Delete Selected
                         </Button>
                     )}
                </div>
                <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" /> Export CSV
                </Button>
            </div>

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]"><Checkbox checked={isAllSelected} onCheckedChange={toggleAll} /></TableHead>
                            {columns.map((col: any) => (
                                <TableHead key={col.accessorKey}>{col.header}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((row: any) => (
                            <TableRow key={row.id}>
                                <TableCell><Checkbox checked={selected.includes(row.id)} onCheckedChange={() => toggleSelect(row.id)} /></TableCell>
                                {columns.map((col: any) => (
                                    <TableCell key={col.accessorKey}>
                                        {col.cell ? col.cell({ row: { original: row } }) : row[col.accessorKey]} // Simplified Render
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
