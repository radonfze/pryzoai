"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewPaymentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Record Customer Payment</h2>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Payment Number</label>
              <Input placeholder="PMT-00001" readOnly className="bg-muted" />
            </div>
            <div>
              <label className="text-sm font-medium">Payment Date *</label>
              <Input type="date" defaultValue={new Date().toISOString().split("T")[0]} />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Customer *</label>
            <Input placeholder="Select customer..." />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Amount *</label>
              <Input type="number" placeholder="0.00" step="0.01" />
            </div>
            <div>
              <label className="text-sm font-medium">Payment Method</label>
              <Select defaultValue="bank_transfer">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Reference / Cheque #</label>
            <Input placeholder="Transaction reference..." />
          </div>

          <div>
            <label className="text-sm font-medium">Apply to Invoice (Optional)</label>
            <Input placeholder="Select invoice to apply payment..." />
          </div>

          <div className="flex gap-4 pt-4">
            <Button disabled={loading}>Record Payment</Button>
            <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
