"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { createStockAdjustment } from "@/actions/inventory/create-adjustment";
import { useState } from "react";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  transactionDate: z.string(),
  reason: z.string().min(3),
  lines: z.array(z.object({
    itemId: z.string().min(1),
    warehouseId: z.string().min(1),
    quantity: z.coerce.number(), // Allow negative
    notes: z.string().optional()
  })).min(1)
});

type FormData = z.infer<typeof formSchema>;

export default function AdjustmentForm({ items, warehouses }: { items: any[], warehouses: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      transactionDate: new Date().toISOString().split("T")[0],
      reason: "",
      lines: [{ itemId: "", warehouseId: "", quantity: 0, notes: "" }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines"
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
        const res = await createStockAdjustment(data, "00000000-0000-0000-0000-000000000000"); // Demo Company
        if (res.success) {
            router.push("/inventory/ledger");
        } else {
            alert("Failed to post adjustment");
        }
    } finally { setLoading(false); }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">Stock Adjustment</h2>
            <Button type="submit" disabled={loading}>{loading ? "Posting..." : "Post Adjustment"}</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
            <FormField name="transactionDate" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
            )} />
             <FormField name="reason" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Reason</FormLabel><FormControl><Input {...field} placeholder="e.g. Stock count correction" /></FormControl></FormItem>
            )} />
        </div>

        <Card>
            <CardContent className="pt-6">
                 <div className="space-y-4">
                     {fields.map((field, index) => (
                         <div key={field.id} className="flex gap-4 items-end">
                              <FormField name={`lines.${index}.itemId`} control={form.control} render={({ field }) => (
                                 <FormItem className="flex-1">
                                     <FormLabel className={index !== 0 ? "sr-only" : ""}>Item</FormLabel>
                                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                                         <FormControl><SelectTrigger><SelectValue placeholder="Select Item" /></SelectTrigger></FormControl>
                                         <SelectContent>{items.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
                                     </Select>
                                 </FormItem>
                             )} />
                             <FormField name={`lines.${index}.warehouseId`} control={form.control} render={({ field }) => (
                                 <FormItem className="flex-1">
                                     <FormLabel className={index !== 0 ? "sr-only" : ""}>Warehouse</FormLabel>
                                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                                         <FormControl><SelectTrigger><SelectValue placeholder="Select Warehouse" /></SelectTrigger></FormControl>
                                         <SelectContent>{warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
                                     </Select>
                                 </FormItem>
                             )} />
                              <FormField name={`lines.${index}.quantity`} control={form.control} render={({ field }) => (
                                 <FormItem className="w-32">
                                     <FormLabel className={index !== 0 ? "sr-only" : ""}>Qty (+/-)</FormLabel>
                                     <FormControl><Input type="number" {...field} /></FormControl>
                                 </FormItem>
                             )} />
                             <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                         </div>
                     ))}
                     <Button type="button" variant="outline" onClick={() => append({ itemId: "", warehouseId: "", quantity: 0, notes: "" })}><Plus className="mr-2 h-4 w-4" /> Add Line</Button>
                 </div>
            </CardContent>
        </Card>
      </form>
    </Form>
  );
}
