"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Plus, Trash2 } from "lucide-react";
import { createPurchaseOrder } from "@/actions/procurement/create-po";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Form Schema
const formSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  orderDate: z.string(),
  dueDate: z.string(),
  items: z.array(z.object({
    itemId: z.string().min(1, "Item is required"),
    quantity: z.coerce.number().min(1),
    unitPrice: z.coerce.number().min(0),
    vatRate: z.coerce.number().default(5),
  })).min(1, "Add at least one item"),
  notes: z.string().optional()
});

type FormData = z.infer<typeof formSchema>;

export default function PurchaseOrderForm({ suppliers, items }: { suppliers: any[], items: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orderDate: new Date().toISOString().split("T")[0],
      dueDate: new Date().toISOString().split("T")[0],
      items: [{ itemId: "", quantity: 1, unitPrice: 0, vatRate: 5 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
        const res = await createPurchaseOrder(data, "00000000-0000-0000-0000-000000000000"); // Demo Company
        if (res.success) {
            router.push(`/procurement/orders/${res.id}`);
        } else {
            console.error(res.error);
            alert("Failed to create PO");
        }
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  }

  // Calculate Total (UI helper)
  const watchedItems = form.watch("items");
  const totalAmount = watchedItems.reduce((sum, item) => {
      return sum + (Number(item.quantity) * Number(item.unitPrice) * (1 + Number(item.vatRate)/100));
  }, 0);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex items-center justify-between">
           <h2 className="text-3xl font-bold tracking-tight">New Purchase Order</h2>
           <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Create Order"}</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="supplierId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Supplier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {suppliers.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
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
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>

        <Card>
            <CardContent className="pt-6">
                <div className="space-y-4">
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex gap-4 items-end">
                            <FormField
                                control={form.control}
                                name={`items.${index}.itemId`}
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormLabel className={index !== 0 ? "sr-only" : ""}>Item</FormLabel>
                                        <Select onValueChange={(val) => {
                                            field.onChange(val);
                                            // Auto-fill price
                                            const item = items.find(i => i.id === val);
                                            if (item) {
                                                form.setValue(`items.${index}.unitPrice`, Number(item.sellingPrice)); // Fallback, usually cost price
                                            }
                                        }} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Item" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {items.filter(i => i.isActive).map(i => (
                                                    <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`items.${index}.quantity`}
                                render={({ field }) => (
                                    <FormItem className="w-24">
                                         <FormLabel className={index !== 0 ? "sr-only" : ""}>Qty</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name={`items.${index}.unitPrice`}
                                render={({ field }) => (
                                    <FormItem className="w-32">
                                         <FormLabel className={index !== 0 ? "sr-only" : ""}>Price</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                             <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" onClick={() => append({ itemId: "", quantity: 1, unitPrice: 0, vatRate: 5 })}>
                        <Plus className="mr-2 h-4 w-4" /> Add Item
                    </Button>
                </div>
            </CardContent>
        </Card>
        
        <div className="flex justify-end">
             <div className="text-right">
                <p className="text-sm text-muted-foreground">Total (Inc. VAT)</p>
                <p className="text-2xl font-bold">{totalAmount.toLocaleString(undefined, { style: 'currency', currency: 'AED' })}</p>
             </div>
        </div>
      </form>
    </Form>
  );
}
