"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Package } from "lucide-react";
import GradientHeader from "@/components/ui/gradient-header";

export default function EditItemPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <GradientHeader
        module="inventory"
        title="Edit Item"
        description={`Modify item details`}
        icon={Package}
      />

      <div className="grid gap-4 lg:grid-cols-3">
         <div className="lg:col-span-2">
            <Card>
                <CardHeader><CardTitle>Edit Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">Editing functionality is currently disabled in this demo.</p>
                    <div className="grid gap-4 md:grid-cols-2">
                         <div>
                            <label className="text-sm font-medium">Item Code</label>
                            <Input disabled value="ITM-LOADING..." />
                         </div>
                    </div>
                </CardContent>
            </Card>
         </div>
         <Card>
             <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
             <CardContent className="space-y-4">
                 <Button variant="outline" className="w-full" onClick={() => router.back()}>Cancel</Button>
                 <Button className="w-full" disabled>Save Changes</Button>
             </CardContent>
         </Card>
      </div>
    </div>
  );
}
