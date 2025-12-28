"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { ArrowRightLeft, Plus } from "lucide-react";
import GradientHeader from "@/components/ui/gradient-header";

export default function NewTransferPage() {
  const router = useRouter();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <GradientHeader
        module="inventory"
        title="New Stock Transfer"
        description="Move inventory between warehouses"
        icon={ArrowRightLeft}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Transfer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="grid gap-4 md:grid-cols-2">
                 <div>
                    <label className="text-sm font-medium">Source Warehouse *</label>
                    <Select>
                        <SelectTrigger><SelectValue placeholder="From..." /></SelectTrigger>
                        <SelectContent>
                             <SelectItem value="main">Main Warehouse</SelectItem>
                             <SelectItem value="shop">Shop Floor</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
                 <div>
                    <label className="text-sm font-medium">Destination Warehouse *</label>
                    <Select>
                        <SelectTrigger><SelectValue placeholder="To..." /></SelectTrigger>
                        <SelectContent>
                             <SelectItem value="main">Main Warehouse</SelectItem>
                             <SelectItem value="shop">Shop Floor</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
               </div>

               <div>
                  <label className="text-sm font-medium">Date</label>
                  <Input type="date" className="md:w-1/2" />
               </div>

               <div className="border rounded-md p-4">
                  <div className="flex justify-between items-center mb-4">
                     <h4 className="font-medium">Items to Transfer</h4>
                     <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" /> Add Item</Button>
                  </div>
                  <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg">
                      No items added yet.
                  </div>
               </div>
               
               <div className="flex gap-4">
                  <Button>Create Transfer</Button>
                  <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
               </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
           <Card>
              <CardHeader><CardTitle>Instructions</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                 <p>1. Select source and destination warehouses.</p>
                 <p>2. Add items and specify quantities.</p>
                 <p>3. Ensure source warehouse has sufficient stock.</p>
                 <p>4. Transfer logic will automatically create "OUT" and "IN" transactions.</p>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
