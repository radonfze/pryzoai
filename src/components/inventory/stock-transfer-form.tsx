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
import { createStockTransferAction } from "@/actions/inventory/create-stock-transfer";
import { toast } from "sonner"; // Assuming sonner is used, or generic toast

const formSchema = z.object({
  fromWarehouseId: z.string().min(1, "Source warehouse is required"),
  toWarehouseId: z.string().min(1, "Destination warehouse is required"),
  transferDate: z.string().min(1, "Date is required"),
  reference: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(z.object({
    itemId: z.string().min(1, "Item is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    uom: z.string().min(1, "UOM is required"),
    notes: z.string().optional(),
  })).min(1, "At least one item is required"),
}).refine((data) => data.fromWarehouseId !== data.toWarehouseId, {
  message: "Source and destination warehouses cannot be the same",
  path: ["toWarehouseId"],
});

type StockTransferFormValues = z.infer<typeof formSchema>;

interface StockTransferFormProps {
  warehouses: any[];
  items: any[];
  initialData?: any; // For edit mode
}

export function StockTransferForm({ warehouses, items, initialData }: StockTransferFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const defaultValues: Partial<StockTransferFormValues> = initialData ? {
    fromWarehouseId: initialData.fromWarehouseId,
    toWarehouseId: initialData.toWarehouseId,
    transferDate: initialData.transferDate ? new Date(initialData.transferDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    reference: initialData.reference || "",
    notes: initialData.notes || "",
    lines: initialData.lines?.map((l: any) => ({
      itemId: l.itemId,
      quantity: Number(l.quantity),
      uom: l.uom,
      notes: l.notes || ""
    })) || [{ itemId: "", quantity: 1, uom: "PCS", notes: "" }],
  } : {
    transferDate: new Date().toISOString().split('T')[0],
    lines: [{ itemId: "", quantity: 1, uom: "PCS", notes: "" }],
  };

  const form = useForm<StockTransferFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    name: "lines",
    control: form.control,
  });

  const onSubmit = async (data: StockTransferFormValues) => {
    setLoading(true);
    try {
      if (initialData) {
        // TODO: Implement update action
        toast.error("Update functionality not implemented yet");
      } else {
        const result = await createStockTransferAction(data);
        if (result.success) {
          toast.success("Stock transfer created successfully");
          router.push(`/inventory/transfers/${result.data.id}`);
        } else {
          toast.error(result.message);
        }
      }
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
                    name="fromWarehouseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Source Warehouse *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!initialData}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select warehouse..." />
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
                  <FormField
                    control={form.control}
                    name="toWarehouseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destination Warehouse *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select warehouse..." />
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

                <div className="grid gap-4 md:grid-cols-2">
                   <FormField
                    control={form.control}
                    name="transferDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transfer Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="reference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reference</FormLabel>
                        <FormControl>
                          <Input placeholder="Optional reference..." {...field} />
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
                          <Input placeholder="Additional notes..." {...field} />
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
                        <h3 className="text-lg font-medium">Items</h3>
                        <Button type="button" variant="outline" size="sm" onClick={() => append({ itemId: "", quantity: 1, uom: "PCS", notes: "" })}>
                            <Plus className="mr-2 h-4 w-4" /> Add Item
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="grid gap-4 md:grid-cols-12 items-end border p-4 rounded-md bg-muted/20">
                                <div className="md:col-span-5">
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
                                <div className="md:col-span-2">
                                     <FormField
                                        control={form.control}
                                        name={`lines.${index}.quantity`}
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className={index !== 0 ? "sr-only" : ""}>Qty</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.001" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                     <FormField
                                        control={form.control}
                                        name={`lines.${index}.uom`}
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className={index !== 0 ? "sr-only" : ""}>UOM</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="PCS">PCS</SelectItem>
                                                <SelectItem value="BOX">BOX</SelectItem>
                                                <SelectItem value="KG">KG</SelectItem>
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
                                        name={`lines.${index}.notes`}
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className={index !== 0 ? "sr-only" : ""}>Notes</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Note..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                        <Trash className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                     {fields.length === 0 && (
                        <div className="text-center py-4 text-muted-foreground text-sm">
                            No items added. Click "Add Item" to start.
                        </div>
                    )}
                </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                 <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {initialData ? "Update Transfer" : "Create Transfer"}
                 </Button>
                 <Button type="button" variant="outline" className="w-full" onClick={() => router.back()}>
                    Cancel
                 </Button>
              </CardContent>
            </Card>
            
            <Card>
                <CardContent className="pt-6">
                    <h4 className="font-medium mb-2 text-sm">Instructions</h4>
                    <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                        <li>Source warehouse inventory will be checked.</li>
                        <li>Items will be reserved upon creation.</li>
                        <li>Stock will be moved upon completion.</li>
                    </ul>
                </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}
