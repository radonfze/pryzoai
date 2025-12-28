"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Save } from "lucide-react";

// Mock Data
const ROLES = ["Administrator", "Manager", "User", "Auditor"];
const PERMISSIONS = [
    { module: "Sales", name: "Create Invoice", code: "sales.invoice.create" },
    { module: "Sales", name: "Approve Invoice", code: "sales.invoice.approve" },
    { module: "Sales", name: "View Reports", code: "sales.reports.view" },
    { module: "Procurement", name: "Create PO", code: "procurement.po.create" },
    { module: "Procurement", name: "Approve PO", code: "procurement.po.approve" },
    { module: "Finance", name: "Post Journal", code: "finance.journal.create" },
    { module: "Finance", name: "View P&L", code: "finance.reports.view" },
    { module: "HR", name: "View Salaries", code: "hr.salary.view" },
    { module: "Admin", name: "Manage Users", code: "admin.users.manage" },
];

export default function PermissionMatrixPage() {
    // In real app, load this from DB (RolePermissions table)
    const [matrix, setMatrix] = useState<Record<string, Set<string>>>({
        "Administrator": new Set(PERMISSIONS.map(p => p.code)),
        "Manager": new Set(["sales.invoice.create", "sales.reports.view", "procurement.po.create"]),
        "User": new Set(["sales.invoice.create"]),
        "Auditor": new Set(["sales.reports.view", "finance.reports.view"]),
    });

    const togglePermission = (role: string, code: string) => {
        const newSet = new Set(matrix[role]);
        if (newSet.has(code)) {
            newSet.delete(code);
        } else {
            newSet.add(code);
        }
        setMatrix({ ...matrix, [role]: newSet });
    };

    const handleSave = () => {
        // Save logic (Server Action)
        toast.success("Permission Matrix updated successfully");
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Permission Matrix</h1>
                <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save Changes</Button>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[300px]">Permission</TableHead>
                            {ROLES.map(role => (
                                <TableHead key={role} className="text-center">{role}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {PERMISSIONS.map((perm) => (
                            <TableRow key={perm.code}>
                                <TableCell>
                                    <div className="font-medium">{perm.name}</div>
                                    <div className="text-xs text-muted-foreground">{perm.module}</div>
                                </TableCell>
                                {ROLES.map(role => (
                                    <TableCell key={role} className="text-center">
                                        <Checkbox 
                                            checked={matrix[role]?.has(perm.code)}
                                            onCheckedChange={() => togglePermission(role, perm.code)}
                                            disabled={role === "Administrator"} // Admin always has all
                                        />
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
