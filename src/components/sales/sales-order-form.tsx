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
  customerId: z.string().min(1, "Customer is required"),
  orderDate: z.string().min(1, "Date is required"),
  deliveryDate: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(z.object({
    itemId: z.string().min(1, "Item is required"),
    quantity: z.number().min(0.001, "Quantity must be at least 0.001"),
    unitPrice: z.number().min(0, "Price cannot be negative"),
    uom: z.string().min(1, "UOM is required"),
    discountPercent: z.number().min(0).max(100).optional(),
    taxId: z.string().optional(),
    description: z.string().optional(),
  })).min(1, "At least one item is required"),
});

type SalesOrderFormValues = z.infer<typeof formSchema>;

interface SalesOrderFormProps {
  customers: any[];
  items: any[];
  initialData?: any; // For edit mode
}

export function SalesOrderForm({ customers, items, initialData }: SalesOrderFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const defaultValues: Partial<SalesOrderFormValues> = initialData ? {
    customerId: initialData.customerId,
    orderDate: initialData.orderDate ? new Date(initialData.orderDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    deliveryDate: initialData.deliveryDate ? new Date(initialData.deliveryDate).toISOString().split('T')[0] : "",
    reference: initialData.reference || "",
    notes: initialData.notes || "",
    lines: initialData.lines?.map((l: any) => ({
      itemId: l.itemId,
      quantity: Number(l.quantity),
      unitPrice: Number(l.unitPrice),
      uom: l.uom,
      discountPercent: Number(l.discountPercent) || 0,
      taxId: l.taxId || "",
      description: l.description || ""
    })) || [{ itemId: "", quantity: 1, unitPrice: 0, uom: "PCS" }],
  } : {
    orderDate: new Date().toISOString().split('T')[0],
    lines: [{ itemId: "", quantity: 1, unitPrice: 0, uom: "PCS", discountPercent: 0 }],
  };

  const form = useForm<SalesOrderFormValues>({
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
    
    // Basic calculation logic (matches backend)
    const lineTotal = qty * price;
    const discountAmount = lineTotal * (discount / 100);
    return sum + (lineTotal - discountAmount);
  }, 0);
  
  // Simple VAT (5%) assumption for UI feedback - Backend handles real tax logic
  const vatAmount = subtotal * 0.05;
  const totalAmount = subtotal + vatAmount;

  const onSubmit = async (data: SalesOrderFormValues) => {
    setLoading(true);
    try {
        // TODO: Replace with actual Server Action call
        console.log("Submitting:", data);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        toast.success(initialData ? "Order updated successfully" : "Order created successfully");
        router.push("/sales/orders");
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = (index: number, itemId: string) => {
      const selectedItem = items.find(i => i.id === itemId);
      if (selectedItem) {
          form.setValue(`lines.${index}.unitPrice`, Number(selectedItem.sellingPrice || 0));
          form.setValue(`lines.${index}.uom`, selectedItem.uom || "PCS");
          // Add description/name if needed
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
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select customer..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {customers.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
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
                        <FormLabel>Delivery Date</FormLabel>
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
                          <Input placeholder="PO # or Ref..." {...field} />
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
                        <Button type="button" variant="outline" size="sm" onClick={() => append({ itemId: "", quantity: 1, unitPrice: 0, uom: "PCS" })}>
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
                                        name={`lines.${index}.discountPercent`}
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className={index !== 0 ? "sr-only" : ""}>Disc %</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" min="0" max="100" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
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
                            <span className="text-muted-foreground">VAT (Est. 5%)</span>
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
