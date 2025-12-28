"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { createInvoiceAction } from "@/actions/sales/create-invoice";

// 1. Zod Schema
const invoiceSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  warehouseId: z.string().min(1, "Warehouse is required"),
  invoiceDate: z.date(),
  dueDate: z.date(),
  items: z.array(z.object({
    itemId: z.string().min(1, "Item is required"),
    quantity: z.coerce.number().min(1, "Qty must be >= 1"),
    unitPrice: z.coerce.number().min(0),
    discountAmount: z.coerce.number().min(0).default(0),
    taxRate: z.coerce.number().default(5),
  })).min(1, "Add at least one item"),
});

// 2. Types
type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  customers: any[]; // Using any for speed, ideally proper types
  items: any[];
  warehouses: any[];
}

import { useRouter } from "next/navigation";

// ... inside component ...
export function InvoiceForm({ customers, items, warehouses }: InvoiceFormProps) {
  const router = useRouter(); // Initialize router
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 3. Form Init
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceDate: new Date(),
      dueDate: new Date(),
      items: [{ itemId: "", quantity: 1, unitPrice: 0, discountAmount: 0, taxRate: 5 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // 4. Calculations Helper
  const watchItems = form.watch("items");
  
  const calculateRowTotal = (index: number) => {
    const item = watchItems[index];
    if (!item) return 0;
    const sub = (item.quantity || 0) * (item.unitPrice || 0);
    const disc = item.discountAmount || 0;
    const taxable = Math.max(0, sub - disc);
    const tax = taxable * ((item.taxRate || 0) / 100);
    return taxable + tax;
  };

  const grandTotal = watchItems.reduce((acc, _, index) => acc + calculateRowTotal(index), 0);

  // 5. Submit Handler
  async function onSubmit(data: InvoiceFormValues) {
    console.log("Submitting form data:", data); // Debug log
    setIsSubmitting(true);
    try {
      // Transform data for server action
      const payload = {
        ...data,
        invoiceDate: data.invoiceDate.toISOString(),
        dueDate: data.dueDate.toISOString(),
        items: data.items.map((item, idx) => {
           const rowTotal = calculateRowTotal(idx);
           // Re-calculate details for server (though server recalcs too for security)
           const sub = item.quantity * item.unitPrice;
           const taxable = sub - item.discountAmount;
           const tax = taxable * (item.taxRate / 100);
           return {
             ...item,
             taxAmount: tax,
             totalAmount: rowTotal
           };
        })
      };
      
      const result = await createInvoiceAction(payload);
      
      if (result.success) {
          // Success Feedback
          alert(result.message); 
          // Redirect to list
          router.push("/sales/invoices"); 
          router.refresh(); 
      } else {
          alert(`Error: ${result.message}`);
      }

    } catch (error) {
      console.error(error);
      alert("Failed to create invoice");
    } finally {
      setIsSubmitting(false);
    }
  }

  // 6. Item Change Handler (to auto-fill price)
  const handleItemSelect = (index: number, itemId: string) => {
    const selectedItem = items.find(i => i.id === itemId);
    if (selectedItem) {
        form.setValue(`items.${index}.unitPrice`, Number(selectedItem.sellingPrice));
        form.setValue(`items.${index}.itemId`, itemId);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Header Section */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem className="col-span-1 md:col-span-2">
                <FormLabel>Customer</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
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
            name="invoiceDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Invoice Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Due Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date("1900-01-01")} initialFocus />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="warehouseId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Warehouse</FormLabel>
                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select warehouse" />
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

        {/* Items Table */}
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[30%]">Item</TableHead>
                            <TableHead className="w-[10%]">Qty</TableHead>
                            <TableHead className="w-[15%]">Price</TableHead>
                            <TableHead className="w-[10%]">Disc</TableHead>
                            <TableHead className="w-[10%]">Tax %</TableHead>
                            <TableHead className="w-[20%] text-right">Total</TableHead>
                            <TableHead className="w-[5%]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fields.map((field, index) => (
                            <TableRow key={field.id}>
                                <TableCell>
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.itemId`}
                                        render={({ field }) => (
                                            <Select onValueChange={(val) => handleItemSelect(index, val)} defaultValue={field.value}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select item" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {items.map(i => (
                                                        <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </TableCell>
                                <TableCell>
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.quantity`}
                                        render={({ field }) => <Input type="number" {...field} />}
                                    />
                                </TableCell>
                                <TableCell>
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.unitPrice`}
                                        render={({ field }) => <Input type="number" {...field} />}
                                    />
                                </TableCell>
                                <TableCell>
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.discountAmount`}
                                        render={({ field }) => <Input type="number" {...field} />}
                                    />
                                </TableCell>
                                <TableCell>
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.taxRate`}
                                        render={({ field }) => <Input type="number" disabled {...field} />}
                                    />
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {calculateRowTotal(index).toFixed(2)}
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="sm" onClick={() => remove(index)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <div className="p-4">
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ itemId: "", quantity: 1, unitPrice: 0, discountAmount: 0, taxRate: 5 })}>
                        <Plus className="mr-2 h-4 w-4" /> Add Item
                    </Button>
                </div>
            </CardContent>
        </Card>

        {/* Footer Totals */}
        <div className="flex justify-end gap-4">
            <div className="w-1/3 space-y-2">
                <div className="flex justify-between text-lg font-bold">
                    <span>Grand Total:</span>
                    <span>{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
            </div>
        </div>

        <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Generating Invoice..." : "Create Invoice"}
            </Button>
        </div>
      </form>
    </Form>
  );
}
