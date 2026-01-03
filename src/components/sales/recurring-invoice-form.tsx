"use client";

import { createRecurringInvoiceAction } from "@/actions/sales/create-recurring-invoice";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const formSchema = z.object({
  templateName: z.string().min(1, "Template name is required"),
  customerId: z.string().min(1, "Customer is required"),
  frequency: z.enum(["weekly", "biweekly", "monthly", "quarterly", "biannually", "yearly"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  dayOfWeek: z.number().min(0).max(6).optional(),
  notes: z.string().optional(),
  autoPost: z.boolean().default(false),
  isActive: z.boolean().default(true),
  lines: z.array(z.object({
    itemId: z.string().min(1, "Item is required"),
    quantity: z.number().min(0.001, "Quantity must be at least 0.001"),
    unitPrice: z.number().min(0, "Price cannot be negative"),
    uom: z.string().min(1, "UOM is required"),
    discountPercent: z.number().min(0).max(100).optional(),
    description: z.string().optional(),
  })).min(1, "At least one item is required"),
});

type RecurringInvoiceFormValues = z.infer<typeof formSchema>;

interface RecurringInvoiceFormProps {
  customers: any[];
  items: any[];
  initialData?: any;
}

export function RecurringInvoiceForm({ customers, items, initialData }: RecurringInvoiceFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const defaultValues: Partial<RecurringInvoiceFormValues> = initialData ? {
    templateName: initialData.templateName,
    customerId: initialData.customerId,
    frequency: initialData.frequency,
    startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : "",
    endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : "",
    dayOfMonth: initialData.dayOfMonth,
    dayOfWeek: initialData.dayOfWeek,
    notes: initialData.notes || "",
    autoPost: initialData.autoPost || false,
    isActive: initialData.isActive !== false, // default true handled in schema
    lines: initialData.lines?.map((l: any) => ({
      itemId: l.itemId,
      quantity: Number(l.quantity),
      unitPrice: Number(l.unitPrice),
      uom: l.uom,
      discountPercent: Number(l.discountPercent) || 0,
      description: l.description || ""
    })) || [{ itemId: "", quantity: 1, unitPrice: 0, uom: "PCS" }],
  } : {
    frequency: "monthly",
    startDate: new Date().toISOString().split('T')[0],
    autoPost: false,
    isActive: true,
    lines: [{ itemId: "", quantity: 1, unitPrice: 0, uom: "PCS", discountPercent: 0 }],
  };

  const form = useForm<RecurringInvoiceFormValues>({
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
  
  const vatAmount = subtotal * 0.05;
  const totalAmount = subtotal + vatAmount;

  const handleItemChange = (index: number, itemId: string) => {
      const selectedItem = items.find(i => i.id === itemId);
      if (selectedItem) {
          form.setValue(`lines.${index}.unitPrice`, Number(selectedItem.sellingPrice || 0));
          form.setValue(`lines.${index}.uom`, selectedItem.uom || "PCS");
      }
  };

  const onSubmit = async (data: RecurringInvoiceFormValues) => {
    setLoading(true);
    try {
        const result = await createRecurringInvoiceAction(data);
        if (result.success) {
            toast.success("Recurring template saved");
            router.push("/sales/recurring-invoices");
        } else {
             toast.error(result.message || "Failed to save template");
        }
    } catch (error) {
        toast.error("Failed to save template");
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
                <CardHeader><CardTitle>Template Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <FormField
                        control={form.control}
                        name="templateName"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Template Name *</FormLabel>
                            <FormControl>
                            <Input placeholder="e.g. Monthly Maintenance" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <div className="grid md:grid-cols-2 gap-4">
                         <FormField
                            control={form.control}
                            name="customerId"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Customer *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="frequency"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Frequency *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="quarterly">Quarterly</SelectItem>
                                    <SelectItem value="yearly">Yearly</SelectItem>
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                </CardContent>
             </Card>

             <Card>
                 <CardHeader><CardTitle>Schedule</CardTitle></CardHeader>
                 <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                         <FormField
                            control={form.control}
                            name="startDate"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Start Date *</FormLabel>
                                <FormControl><Input type="date" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="endDate"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>End Date (Optional)</FormLabel>
                                <FormControl><Input type="date" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                     </div>
                     <div className="flex items-center space-x-2">
                        <FormField
                            control={form.control}
                            name="autoPost"
                            render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 w-full">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">Auto-Post Invoice</FormLabel>
                                    <div className="text-sm text-muted-foreground">Automatically post to GL upon creation</div>
                                </div>
                                <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                            </FormItem>
                            )}
                        />
                     </div>
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
                                                 <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
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
                                <div className="md:col-span-1 flex justify-end">
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                        <Trash className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
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

            <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? "Update Template" : "Create Template"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
