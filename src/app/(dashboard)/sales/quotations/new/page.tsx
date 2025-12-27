"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";

export default function NewQuotationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">New Quotation</h2>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Quotation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Quote Number</label>
                  <Input placeholder="QT-00001" readOnly className="bg-muted" />
                </div>
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <Input type="date" defaultValue={new Date().toISOString().split("T")[0]} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Customer *</label>
                  <Input placeholder="Select customer..." />
                </div>
                <div>
                  <label className="text-sm font-medium">Valid Until</label>
                  <Input type="date" />
                </div>
              </div>

              <div className="border rounded-md p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">Line Items</h4>
                  <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" /> Add Item</Button>
                </div>
                <p className="text-center text-muted-foreground py-4">No items added</p>
              </div>

              <div className="flex gap-4">
                <Button disabled={loading}>Create Quotation</Button>
                <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between"><span>Subtotal</span><span className="font-mono">AED 0.00</span></div>
            <div className="flex justify-between"><span>VAT (5%)</span><span className="font-mono">AED 0.00</span></div>
            <hr />
            <div className="flex justify-between font-bold"><span>Total</span><span className="font-mono">AED 0.00</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
