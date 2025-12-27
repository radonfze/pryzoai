"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";

export default function NewGRNPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">New Goods Receipt Note</h2>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Receipt Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">GRN Number</label>
                  <Input placeholder="GRN-00001" readOnly className="bg-muted" />
                </div>
                <div>
                  <label className="text-sm font-medium">Receipt Date *</label>
                  <Input type="date" defaultValue={new Date().toISOString().split("T")[0]} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Supplier *</label>
                  <Input placeholder="Select supplier..." />
                </div>
                <div>
                  <label className="text-sm font-medium">Purchase Order</label>
                  <Input placeholder="Select PO to receive..." />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Warehouse *</label>
                <Input placeholder="Select receiving warehouse..." />
              </div>

              <div className="border rounded-md p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">Items Received</h4>
                  <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" /> Add Item</Button>
                </div>
                <p className="text-center text-muted-foreground py-4">No items. Select a PO or add items manually.</p>
              </div>

              <div className="flex gap-4">
                <Button disabled={loading}>Create GRN</Button>
                <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between"><span>Total Items</span><span>0</span></div>
            <div className="flex justify-between"><span>Total Qty</span><span>0</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
