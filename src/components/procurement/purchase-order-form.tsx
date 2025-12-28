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
import { createPurchaseOrderAction } from "@/actions/procurement/create-order"; // Assuming this exists or will be created/renamed

// Schema validation
const formSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  orderDate: z.string().min(1, "Date is required"),
  deliveryDate: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  currency: z.string().default("AED"),
  lines: z.array(z.object({
    itemId: z.string().min(1, "Item is required"),
    quantity: z.number().min(0.001, "Quantity must be at least 0.001"),
    unitPrice: z.number().min(0, "Price cannot be negative"),
    uom: z.string().min(1, "UOM is required"),
    discountPercent: z.number().min(0).max(100).optional(),
    taxRate: z.number().default(5),
    description: z.string().optional(),
  })).min(1, "At least one item is required"),
});

type PurchaseOrderFormValues = z.infer<typeof formSchema>;

interface PurchaseOrderFormProps {
  suppliers: any[];
  items: any[];
  initialData?: any; // For edit mode
}

export function PurchaseOrderForm({ suppliers, items, initialData }: PurchaseOrderFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const defaultValues: Partial<PurchaseOrderFormValues> = initialData ? {
    supplierId: initialData.supplierId,
    orderDate: initialData.orderDate ? new Date(initialData.orderDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    deliveryDate: initialData.deliveryDate ? new Date(initialData.deliveryDate).toISOString().split('T')[0] : "",
    reference: initialData.reference || "",
    notes: initialData.notes || "",
    currency: initialData.currency || "AED",
    lines: initialData.lines?.map((l: any) => ({
      itemId: l.itemId,
      quantity: Number(l.quantity),
      unitPrice: Number(l.unitPrice),
      uom: l.uom,
      discountPercent: Number(l.discountPercent) || 0,
      taxRate: l.taxRate || 5, // Default logic if missing
      description: l.description || ""
    })) || [{ itemId: "", quantity: 1, unitPrice: 0, uom: "PCS", taxRate: 5 }],
  } : {
    orderDate: new Date().toISOString().split('T')[0],
    currency: "AED",
    lines: [{ itemId: "", quantity: 1, unitPrice: 0, uom: "PCS", discountPercent: 0, taxRate: 5 }],
  };

  const form = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    name: "lines",
    control: form.control,
  });

  // Calculate totals
  const watchLines = form.watch("lines");
  const subtotal = watchLines.reduce((sum, line) => {
    const qty = Number(line.quantity) || 0;
    const price = Number(line.unitPrice) || 0;
    const discount = Number(line.discountPercent) || 0;
    
    const lineTotal = qty * price;
    const discountAmount = lineTotal * (discount / 100);
    return sum + (lineTotal - discountAmount);
  }, 0);
  
  // Basic VAT calc per line (simplified for UI)
  const vatAmount = watchLines.reduce((sum, line) => {
      const qty = Number(line.quantity) || 0;
      const price = Number(line.unitPrice) || 0;
      const discount = Number(line.discountPercent) || 0;
      const taxRate = Number(line.taxRate) || 0;

      const lineTotal = qty * price;
      const discountAmount = lineTotal * (discount / 100);
      const taxable = lineTotal - discountAmount;
      return sum + (taxable * (taxRate / 100));
  }, 0);

  const totalAmount = subtotal + vatAmount;

  const onSubmit = async (data: PurchaseOrderFormValues) => {
    setLoading(true);
    try {
        // TODO: Replace with actual Server Action call
        console.log("Submitting:", data);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        toast.success(initialData ? "Purchase order updated successfully" : "Purchase order created successfully");
        router.push("/procurement/orders");
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = (index: number, itemId: string) => {
      const selectedItem = items.find(i => i.id === itemId);
      if (selectedItem) {
          form.setValue(`lines.${index}.unitPrice`, Number(selectedItem.purchasePrice || selectedItem.costPrice || 0));
          form.setValue(`lines.${index}.uom`, selectedItem.uom || "PCS");
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
                    name="supplierId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplier *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select supplier..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {suppliers.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name}
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
                    name="orderDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                   <FormField
                    control={form.control}
                    name="deliveryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected Delivery</FormLabel>
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
                          <Input placeholder="Quote # or Ref..." {...field} />
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
                        <h3 className="text-lg font-medium">Line Items</h3>
                        <Button type="button" variant="outline" size="sm" onClick={() => append({ itemId: "", quantity: 1, unitPrice: 0, uom: "PCS", taxRate: 5 })}>
                            <Plus className="mr-2 h-4 w-4" /> Add Item
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
                                            <Select 
                                                onValueChange={(val) => {
                                                    field.onChange(val);
                                                    handleItemChange(index, val);
                                                }} 
                                                defaultValue={field.value}
                                            >
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
                                        name={`lines.${index}.unitPrice`}
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className={index !== 0 ? "sr-only" : ""}>Price</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                     <FormField
                                        control={form.control}
                                        name={`lines.${index}.taxRate`}
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className={index !== 0 ? "sr-only" : ""}>VAT %</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.1" min="0" max="100" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
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
                            No items added. Click "Add Item" to start.
                        </div>
                    )}
                </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>AED {subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">VAT</span>
                            <span>AED {vatAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between font-bold">
                            <span>Total</span>
                            <span>AED {totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                 <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {initialData ? "Update Order" : "Create Order"}
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
