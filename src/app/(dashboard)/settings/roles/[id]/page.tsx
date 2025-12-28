"use client";

import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Save } from "lucide-react";
import { useState } from "react";

export default function RoleDetailPage() {
  const params = useParams();
  const roleId = params.id as string;
  
  const [saving, setSaving] = useState(false);

  // Mock role data - replace with actual DB fetch
  const role = {
    id: roleId,
    name: "Administrator",
    description: "Full system access",
  };

  const permissions = [
    { module: "Sales", read: true, write: true, delete: true },
    { module: "Purchase", read: true, write: true, delete: false },
    { module: "Inventory", read: true, write: false, delete: false },
    { module: "Finance", read: true, write: true, delete: true },
    { module: "HR", read: true, write: false, delete: false },
    { module: "Settings", read: true, write: true, delete: false },
  ];

  async function handleSave() {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8" />
            {role.name}
          </h2>
          <p className="text-muted-foreground">Configure role permissions</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Role Details */}
      <Card>
        <CardHeader>
          <CardTitle>Role Information</CardTitle>
          <CardDescription>Basic role details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Role Name</Label>
            <Input id="name" defaultValue={role.name} />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input id="description" defaultValue={role.description} />
          </div>
        </CardContent>
      </Card>

      {/* Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Module Permissions</CardTitle>
          <CardDescription>Configure access permissions for each module</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {permissions.map((perm) => (
              <div key={perm.module} className="flex items-center justify-between border-b pb-4">
                <div className="font-medium">{perm.module}</div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox id={`${perm.module}-read`} defaultChecked={perm.read} />
                    <label htmlFor={`${perm.module}-read`} className="text-sm">Read</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id={`${perm.module}-write`} defaultChecked={perm.write} />
                    <label htmlFor={`${perm.module}-write`} className="text-sm">Write</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id={`${perm.module}-delete`} defaultChecked={perm.delete} />
                    <label htmlFor={`${perm.module}-delete`} className="text-sm">Delete</label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
