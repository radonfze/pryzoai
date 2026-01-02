"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Save, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PERMISSIONS } from "@/db/schema";
import { updateRole, RoleInput } from "@/actions/settings/role-actions";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

interface RoleEditorProps {
    role: {
        id: string;
        name: string;
        description: string | null;
        isActive: boolean;
        permissions: string[];
        code: string;
    };
}

export function RoleEditor({ role }: RoleEditorProps) {
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: role.name,
        description: role.description || "",
        isActive: role.isActive,
    });
    const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set(role.permissions));

    // Group permissions
    const groupedPermissions = PERMISSIONS.reduce((acc, perm) => {
        const [module, resource, action] = perm.split(".");
        // e.g. inventory.items.view => Module: inventory, Resource: items 
        const key = module; // Group by top-level module
        if (!acc[key]) acc[key] = [];
        acc[key].push({ perm, resource, action });
        return acc;
    }, {} as Record<string, { perm: string; resource: string; action: string }[]>);

    const togglePermission = (perm: string) => {
        const next = new Set(selectedPermissions);
        if (next.has(perm)) {
            next.delete(perm);
        } else {
            next.add(perm);
        }
        setSelectedPermissions(next);
    };

    const toggleGroup = (perms: string[]) => {
        const allSelected = perms.every(p => selectedPermissions.has(p));
        const next = new Set(selectedPermissions);
        if (allSelected) {
            perms.forEach(p => next.delete(p));
        } else {
            perms.forEach(p => next.add(p));
        }
        setSelectedPermissions(next);
    }

    async function handleSave() {
        setSaving(true);
        try {
            const input: RoleInput = {
                name: formData.name,
                description: formData.description,
                isActive: formData.isActive,
                permissions: Array.from(selectedPermissions)
            };

            const result = await updateRole(role.id, input);
            if (result.success) {
                toast.success("Role updated successfully");
            } else {
                toast.error(result.message || "Failed to update role");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Shield className="h-8 w-8 text-primary" />
                        {role.name}
                        <span className="text-sm font-mono text-muted-foreground ml-2">({role.code})</span>
                    </h2>
                    <p className="text-muted-foreground">Configure role permissions and access levels</p>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Left Column: Details */}
                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Role Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="name">Role Name</Label>
                                <Input 
                                    id="name" 
                                    value={formData.name} 
                                    onChange={e => setFormData({ ...formData, name: e.target.value })} 
                                />
                            </div>
                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Input 
                                    id="description" 
                                    value={formData.description} 
                                    onChange={e => setFormData({ ...formData, description: e.target.value })} 
                                />
                            </div>
                            <div className="flex items-center justify-between border p-3 rounded-lg">
                                <Label htmlFor="isActive" className="cursor-pointer">Active Status</Label>
                                <Switch 
                                    id="isActive" 
                                    checked={formData.isActive}
                                    onCheckedChange={checked => setFormData({ ...formData, isActive: checked })}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Permissions Matrix */}
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Permissions Matrix</CardTitle>
                            <CardDescription>Grant specific capabilities to this role</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {Object.entries(groupedPermissions).map(([module, perms]) => (
                                <div key={module} className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-semibold capitalize text-lg flex items-center gap-2">
                                            {module}
                                            <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                                {perms.filter(p => selectedPermissions.has(p.perm)).length} / {perms.length}
                                            </span>
                                        </h3>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => toggleGroup(perms.map(p => p.perm))}
                                            className="h-8 text-xs"
                                        >
                                            {perms.every(p => selectedPermissions.has(p.perm)) ? "Deselect All" : "Select All"}
                                        </Button>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {perms.map(({ perm, resource, action }) => (
                                            <div key={perm} className="flex items-start space-x-2 border p-2 rounded hover:bg-muted/50 transition-colors">
                                                <Checkbox 
                                                    id={perm} 
                                                    checked={selectedPermissions.has(perm)}
                                                    onCheckedChange={() => togglePermission(perm)}
                                                />
                                                <div className="grid gap-1.5 leading-none">
                                                    <label 
                                                        htmlFor={perm} 
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer capitalize"
                                                    >
                                                        {resource} • {action.replace('_', ' ')}
                                                    </label>
                                                    <p className="text-[10px] text-muted-foreground font-mono">{perm}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
