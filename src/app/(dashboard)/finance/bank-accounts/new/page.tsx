"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewBankAccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Add Bank Account</h2>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Account Name *</label>
            <Input placeholder="e.g., Main Operating Account" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Bank Name *</label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select bank..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="emirates_nbd">Emirates NBD</SelectItem>
                  <SelectItem value="adcb">ADCB</SelectItem>
                  <SelectItem value="fab">First Abu Dhabi Bank</SelectItem>
                  <SelectItem value="mashreq">Mashreq Bank</SelectItem>
                  <SelectItem value="dib">Dubai Islamic Bank</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Account Type</label>
              <Select defaultValue="current">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current Account</SelectItem>
                  <SelectItem value="savings">Savings Account</SelectItem>
                  <SelectItem value="fixed">Fixed Deposit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Account Number *</label>
              <Input placeholder="Account number" />
            </div>
            <div>
              <label className="text-sm font-medium">IBAN</label>
              <Input placeholder="AE XX XXXX XXXX XXXX XXXX XXX" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Currency</label>
              <Select defaultValue="AED">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Opening Balance</label>
              <Input type="number" placeholder="0.00" step="0.01" />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button disabled={loading}>Add Account</Button>
            <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
