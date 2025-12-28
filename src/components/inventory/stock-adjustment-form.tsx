"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

// Schema validation
const formSchema = z.object({
  adjustmentDate: z.string().min(1, "Date is required"),
  reason: z.string().min(3, "Reason is required (min 3 chars)"),
  notes: z.string().optional(),
  lines: z.array(z.object({
    itemId: z.string().min(1, "Item is required"),
    warehouseId: z.string().min(1, "Warehouse is required"),
    currentQty: z.number().default(0), // Snapshot
    adjustedQty: z.number().min(0, "Quantity cannot be negative"),
    reason: z.string().optional(), // Line level reason
  })).min(1, "At least one item is required"),
});

type AdjustmentFormValues = z.infer<typeof formSchema>;

interface StockAdjustmentFormProps {
  items: any[];
  warehouses: any[];
  initialData?: any; // For edit mode
}

export function StockAdjustmentForm({ items, warehouses, initialData }: StockAdjustmentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const defaultValues: Partial<AdjustmentFormValues> = initialData ? {
    adjustmentDate: initialData.adjustmentDate ? new Date(initialData.adjustmentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    reason: initialData.reason || "",
    notes: initialData.notes || "",
    lines: initialData.lines?.map((l: any) => ({
      itemId: l.itemId,
      warehouseId: l.warehouseId,
      currentQty: Number(l.currentQty),
      adjustedQty: Number(l.adjustedQty),
      reason: l.reason || ""
    })) || [{ itemId: "", warehouseId: "", currentQty: 0, adjustedQty: 0 }],
  } : {
    adjustmentDate: new Date().toISOString().split('T')[0],
    reason: "Stock Correction",
    lines: [{ itemId: "", warehouseId: "", currentQty: 0, adjustedQty: 0 }],
  };

  const form = useForm<AdjustmentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    name: "lines",
    control: form.control,
  });

  const onSubmit = async (data: AdjustmentFormValues) => {
    setLoading(true);
    try {
        // TODO: Replace with actual Server Action call
        console.log("Submitting Adjustment:", data);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        toast.success(initialData ? "Adjustment updated successfully" : "Adjustment posted successfully");
        router.push("/inventory/adjustments"); // Redirect to list
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="adjustmentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason / Reference *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Audit correction" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Input placeholder="Internal notes..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">Adjustments</h3>
                        <Button type="button" variant="outline" size="sm" onClick={() => append({ itemId: "", warehouseId: "", currentQty: 0, adjustedQty: 0 })}>
                            <Plus className="mr-2 h-4 w-4" /> Add Line
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="grid gap-4 md:grid-cols-12 items-end border p-4 rounded-md bg-muted/20">
                                <div className="md:col-span-4">
                                    <FormField
                                        control={form.control}
                                        name={`lines.${index}.itemId`}
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className={index !== 0 ? "sr-only" : ""}>Item</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                <SelectValue placeholder="Select item..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {items.map((item) => (
                                                <SelectItem key={item.id} value={item.id}>
                                                    {item.code} - {item.name}
                                                </SelectItem>
                                                ))}
                                            </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                     <FormField
                                        control={form.control}
                                        name={`lines.${index}.warehouseId`}
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className={index !== 0 ? "sr-only" : ""}>Warehouse</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {warehouses.map((w) => (
                                                <SelectItem key={w.id} value={w.id}>
                                                    {w.name}
                                                </SelectItem>
                                                ))}
                                            </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                     <FormField
                                        control={form.control}
                                        name={`lines.${index}.adjustedQty`}
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className={index !== 0 ? "sr-only" : ""}>New Qty</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.001" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                   {/* Variance display could go here */}
                                   <div className="text-xs text-muted-foreground pb-2">
                                     Sets final qty
                                   </div>
                                </div>
                                
                                <div className="md:col-span-1 flex justify-end">
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                        <Trash className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                     {fields.length === 0 && (
                        <div className="text-center py-4 text-muted-foreground text-sm">
                            No adjustments added. Click "Add Line" to start.
                        </div>
                    )}
                </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                        <div className="text-sm font-medium">Impact</div>
                        <p className="text-xs text-muted-foreground">
                            This will create a stock transaction to adjust the quantity on hand to matches the "New Qty".
                            Variance will be posted to the inventory adjustment account.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                 <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {initialData ? "Update Adjustment" : "Post Adjustment"}
                 </Button>
                 <Button type="button" variant="outline" className="w-full" onClick={() => router.back()}>
                    Cancel
                 </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}
