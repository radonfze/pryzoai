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
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash, Loader2, ArrowLeft, Home } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { createInvoiceAction } from "@/actions/sales/create-invoice";
import { addDays, format, parseISO } from "date-fns";
import { getTieredPrice } from "@/lib/services/tiered-pricing-service";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  invoiceDate: z.string().min(1, "Date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  salesOrderId: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(z.object({
    itemId: z.string().min(1, "Item is required"),
    quantity: z.number().min(0.001, "Quantity required"),
    unitPrice: z.number().min(0, "Price required"),
    discountPercent: z.number().min(0).max(100).optional(),
    taxId: z.string().optional(),
    description: z.string().optional(),
  })).min(1, "At least one item is required"),
});

type InvoiceFormValues = z.infer<typeof formSchema>;

interface InvoiceFormProps {
  customers: any[];
  items: any[];
  warehouses: any[];
  taxes?: any[];
  initialData?: any;
}

export function InvoiceForm({ customers, items, warehouses, taxes, initialData }: InvoiceFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [reservedNumber, setReservedNumber] = useState<string>("");
  const [numberLoading, setNumberLoading] = useState(!initialData);

  const defaultValues: Partial<InvoiceFormValues> = initialData ? {
    customerId: initialData.customerId,
    invoiceDate: initialData.invoiceDate ? new Date(initialData.invoiceDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    salesOrderId: initialData.salesOrderId || "",
    notes: initialData.notes || "",
    lines: initialData.lines || [{ itemId: "", quantity: 1, unitPrice: 0, discountPercent: 0 }],
  } : {
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0], // Default to same as invoice date
    lines: [{ itemId: "", quantity: 1, unitPrice: 0, discountPercent: 0 }],
  };

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    name: "lines",
    control: form.control,
  });

  // Track form dirty state for unsaved changes warning
  const isDirty = form.formState.isDirty;

  // Warn user when leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !loading) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, loading]);

  // Reserve document number on mount (only for new invoices)
  useEffect(() => {
    if (initialData) {
      // Editing existing invoice - use its number
      setReservedNumber(initialData.invoiceNumber || "");
      setNumberLoading(false);
      return;
    }

    // Reserve a new number for new invoice
    const reserveNumber = async () => {
      try {
        const response = await fetch('/api/numbers/reserve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entityType: 'invoice', documentType: 'INV' })
        });
        
        const data = await response.json();
        
        if (data.success && data.number) {
          setReservedNumber(data.number);
        } else {
          toast.error(data.error || "Failed to reserve invoice number");
        }
      } catch (error) {
        console.error("Number reservation error:", error);
        toast.error("Failed to reserve invoice number. Please refresh.");
      } finally {
        setNumberLoading(false);
      }
    };

    reserveNumber();
  }, []); // Empty deps - only run once on mount

  // Watchers for Logic
  const watchCustomerId = form.watch("customerId");
  const watchInvoiceDate = form.watch("invoiceDate");

  // Logic: Auto-calculate Due Date based on Customer Terms
  useEffect(() => {
    // Only run if we have both customer and invoice date
    if (watchCustomerId && watchInvoiceDate) {
        const customer = customers.find(c => c.id === watchCustomerId);
        if (customer && customer.paymentTermDays) {
            const days = Number(customer.paymentTermDays);
            if (!isNaN(days) && days > 0) {
               try {
                 const baseDate = parseISO(watchInvoiceDate);
                 const newDue = addDays(baseDate, days);
                 form.setValue("dueDate", format(newDue, "yyyy-MM-dd"));
                 return;
               } catch (e) {
                 // Invalid date format safety
               }
            }
        }
        // If no terms or 0 days, default to Invoice Date (Net 0)
        // BUT only if user hasn't explicitly set a different due date? 
        // User request: "due date must be same as invoice date unless..."
        // So we enforce this logic on change. 
        // If user wants custom, they can change Due Date *after* this effect runs? 
        // Or this effect runs on every render? No, dependency array.
        // It runs when customerId or invoiceDate changes.
        // So if I change invoice date -> due date updates.
        // If I change customer -> due date updates.
        // If I change Due Date manually -> This effect does NOT run. Perfect.
        form.setValue("dueDate", watchInvoiceDate);
    }
  }, [watchCustomerId, watchInvoiceDate, customers, form]);

  const watchLines = form.watch("lines");
  const subtotal = watchLines.reduce((sum, line) => {
    const qty = Number(line.quantity) || 0;
    const price = Number(line.unitPrice) || 0;
    const discount = Number(line.discountPercent) || 0;
    const lineTotal = qty * price * (1 - discount / 100);
    return sum + lineTotal;
  }, 0);
  const vatAmount = subtotal * 0.05;
  const totalAmount = subtotal + vatAmount;

  const onSubmit = async (data: InvoiceFormValues) => {
    console.log("📝 Invoice form onSubmit triggered with data:", data);
    
    // Prevent duplicate submissions
    if (loading) {
      console.warn("⚠️ Form is already submitting, ignoring duplicate submission");
      return;
    }
    
    setLoading(true);
    try {
      // Map form data to action interface
      const vatRate = 5;
      
      const mappedItems = data.lines.map(l => {
        const qty = Number(l.quantity) || 0;
        const price = Number(l.unitPrice) || 0;
        const disc = Number(l.discountPercent) || 0;
        const discAmount = (qty * price * disc) / 100;
        const lineSubtotal = qty * price - discAmount;
        const taxAmt = lineSubtotal * (vatRate / 100);
        return {
          itemId: l.itemId,
          description: l.description || "",
          quantity: qty,
          unitPrice: price,
          discountAmount: discAmount,
          taxRate: vatRate,
          taxAmount: taxAmt,
          totalAmount: lineSubtotal + taxAmt
        };
      });
      
      // Use passed warehouses prop
      const defaultWarehouse = warehouses?.[0]?.id;
      
      if (!defaultWarehouse) {
        toast.error("No warehouse configured. Please add a warehouse in Settings.");
        setLoading(false);
        return;
      }
      
      console.log("📤 Calling createInvoiceAction with payload:", {
        customerId: data.customerId,
        warehouseId: defaultWarehouse,
        invoiceDate: data.invoiceDate,
        dueDate: data.dueDate,
        itemCount: mappedItems.length,
        invoiceNumber: reservedNumber || undefined,
      });
      
      const result = await createInvoiceAction({
        customerId: data.customerId,
        warehouseId: defaultWarehouse,
        invoiceDate: data.invoiceDate,
        dueDate: data.dueDate,
        notes: data.notes,
        items: mappedItems,
        invoiceNumber: reservedNumber || undefined,
      });
      
      console.log("📥 createInvoiceAction result:", result);
      console.log("📥 result.success:", result?.success);
      console.log("📥 result.message:", result?.message);
      console.log("📥 result type:", typeof result);
      console.log("📥 result keys:", result ? Object.keys(result) : "null");
      
      if (result && result.success) {
        console.log("✅ SUCCESS CONDITION MET - Showing toast and redirecting");
        
        // Show toast first
        toast.success(result.message || "Invoice created successfully", {
          duration: 2000,
        });
        
        // Redirect after showing toast
        setTimeout(() => {
          router.push("/sales/invoices");
          router.refresh();
        }, 1500); // 1.5 second delay to show toast
      } else {
        console.error("❌ SUCCESS CONDITION NOT MET");
        console.error("❌ Invoice creation failed:", result?.message || "Unknown error");
        toast.error(result?.message || "Failed to create invoice");
      }
    } catch (error: any) {
      console.error("💥 Invoice submission error:", error);
      toast.error(error.message || "Failed to create invoice. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Track tiered pricing info per line
  const [tierInfo, setTierInfo] = useState<Record<number, { tierName?: string; savings: number; tierApplied: boolean }>>({}); 

  const handleItemChange = async (index: number, itemId: string) => {
    const selectedItem = items.find(i => i.id === itemId);
    if (selectedItem) {
      const currentQty = form.getValues(`lines.${index}.quantity`) || 1;
      // Try to get tiered price
      try {
        const tiered = await getTieredPrice(itemId, currentQty, Number(selectedItem.sellingPrice || 0));
        form.setValue(`lines.${index}.unitPrice`, tiered.tieredPrice);
        setTierInfo(prev => ({ ...prev, [index]: { tierName: tiered.tierName, savings: tiered.savings, tierApplied: tiered.tierApplied } }));
      } catch {
        form.setValue(`lines.${index}.unitPrice`, Number(selectedItem.sellingPrice || 0));
        setTierInfo(prev => ({ ...prev, [index]: { tierApplied: false, savings: 0 } }));
      }
    }
  };

  // Handle quantity change - check for tier pricing
  const handleQuantityChange = async (index: number, newQty: number) => {
    const itemId = form.getValues(`lines.${index}.itemId`);
    if (!itemId) return;
    
    const selectedItem = items.find(i => i.id === itemId);
    if (!selectedItem) return;
    
    try {
      const tiered = await getTieredPrice(itemId, newQty, Number(selectedItem.sellingPrice || 0));
      if (tiered.tierApplied) {
        form.setValue(`lines.${index}.unitPrice`, tiered.tieredPrice);
        setTierInfo(prev => ({ ...prev, [index]: { tierName: tiered.tierName, savings: tiered.savings, tierApplied: true } }));
        toast.info(`${tiered.tierName} applied! Saving ${tiered.savings.toFixed(2)} AED`);
      } else {
        setTierInfo(prev => ({ ...prev, [index]: { tierApplied: false, savings: 0 } }));
      }
    } catch {
      // Silent fail - keep current price
    }
  };

  // Handle form validation errors
  const onInvalid = (errors: any) => {
    console.error("📛 Form validation errors:", errors);
    const errorMessages = Object.entries(errors)
      .map(([key, value]: [string, any]) => {
        if (key === 'lines' && Array.isArray(value)) {
          const lineErrors = value
            .map((lineError, idx) => {
              if (lineError) {
                const fieldErrors = Object.entries(lineError)
                  .map(([field, err]: [string, any]) => `Line ${idx + 1} ${field}: ${err?.message}`)
                  .join(', ');
                return fieldErrors;
              }
              return null;
            })
            .filter(Boolean);
          return lineErrors.join('; ');
        }
        return `${key}: ${value?.message}`;
      })
      .filter(Boolean);
    
    toast.error(`Validation failed: ${errorMessages.join(', ')}`);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
        {/* Navigation Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Link href="/sales/invoices">
              <Button type="button" variant="ghost" size="icon">
                <Home className="h-4 w-4" />
              </Button>
            </Link>
            <div className="border-l pl-4 ml-2">
              <h2 className="text-xl font-semibold">
                {initialData ? `Edit Invoice: ${reservedNumber}` : "New Invoice"}
              </h2>
              {!initialData && reservedNumber && (
                <p className="text-sm text-muted-foreground">Reserved: {reservedNumber}</p>
              )}
            </div>
          </div>
          {isDirty && (
            <span className="text-sm text-amber-600 flex items-center gap-1">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              Unsaved changes
            </span>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardContent className="pt-6">
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
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
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
                      <FormItem>
                        <FormLabel>Invoice Date *</FormLabel>
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
                        <FormLabel>Due Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <CardTitle>Line Items</CardTitle>
                    {reservedNumber && (
                      <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-primary/10 border border-primary/20">
                        <span className="text-xs text-muted-foreground">Invoice #:</span>
                        <span className="text-sm font-mono font-bold">{reservedNumber}</span>
                      </div>
                    )}
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ itemId: "", quantity: 1, unitPrice: 0, discountPercent: 0 })}>
                    <Plus className="mr-2 h-4 w-4" /> Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                  <div className="space-y-4">
                  {fields.map((field, index) => {
                    // Watch values for this specific row to handle bidirectional logic
                    // We must use form.getValues() or watch outside? 
                    // To avoid perf issues, we can just defer to the Input's logic or use basic watch for calculations
                    // But for "value" prop, we need current state.
                    const currentQty = form.watch(`lines.${index}.quantity`) || 0;
                    const currentPrice = form.watch(`lines.${index}.unitPrice`) || 0;
                    const currentSubtotal = (currentQty * currentPrice);

                    return (
                    <div key={field.id} className="grid gap-2 grid-cols-12 items-end border p-3 rounded-md bg-muted/20">
                      <div className="col-span-12 md:col-span-5">
                        <FormField
                          control={form.control}
                          name={`lines.${index}.itemId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={index > 0 ? "sr-only" : ""}>Item</FormLabel>
                              <Select onValueChange={(val) => {
                                field.onChange(val);
                                handleItemChange(index, val);
                              }} defaultValue={field.value}>
                                
                                <FormControl>
                                  <div>
                                    <HoverCard>
                                      <HoverCardTrigger asChild>
                                          <SelectTrigger className="w-full truncate text-left">
                                            <SelectValue placeholder="Select..." />
                                          </SelectTrigger>
                                      </HoverCardTrigger>
                                      <HoverCardContent className="w-80 p-4 border shadow-lg bg-popover text-popover-foreground z-50">
                                         {field.value ? (() => {
                                            const selected = items.find(i => i.id === field.value);
                                            if (!selected) return <p className="text-sm">No item selected</p>;
                                            return (
                                              <div className="space-y-2">
                                                 <h4 className="text-sm font-semibold">{selected.name}</h4>
                                                 <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                                                    <div>Code: <span className="text-foreground">{selected.code}</span></div>
                                                    <div>Cost: <span className="text-foreground">{Number(selected.costPrice || 0).toFixed(2)}</span></div>
                                                    <div>Price: <span className="text-foreground">{Number(selected.sellingPrice || 0).toFixed(2)}</span></div>
                                                    <div>Tax: <span className="text-foreground">{Number(selected.taxPercent || 0)}%</span></div>
                                                 </div>
                                              </div>
                                            );
                                         })() : (
                                            <p className="text-sm text-muted-foreground">Select an item to see details</p>
                                         )}
                                      </HoverCardContent>
                                    </HoverCard>
                                  </div>
                                </FormControl>
                                
                                <SelectContent>
                                  {items.map((item) => (
                                    <SelectItem key={item.id} value={item.id}>
                                       <span className="truncate block max-w-[300px]">{item.code} - {item.name}</span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="col-span-4 md:col-span-1">
                        <FormField
                          control={form.control}
                          name={`lines.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={index > 0 ? "sr-only" : ""}>Qty</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.001" {...field} onChange={e => {
                                  const newQty = parseFloat(e.target.value) || 0;
                                  field.onChange(newQty);
                                  handleQuantityChange(index, newQty);
                                }} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="col-span-4 md:col-span-2">
                        <FormField
                          control={form.control}
                          name={`lines.${index}.unitPrice`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={index > 0 ? "sr-only" : ""}>
                                Price
                                {tierInfo[index]?.tierApplied && (
                                  <Badge variant="secondary" className="ml-2 text-xs">
                                    {tierInfo[index].tierName || "Tier"}
                                  </Badge>
                                )}
                              </FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {/* Editable Subtotal Column */}
                      <div className="col-span-6 md:col-span-2">
                         <FormItem>
                            <FormLabel className={index > 0 ? "sr-only" : ""}>Subtotal</FormLabel>
                            <FormControl>
                               <Input 
                                  type="number" 
                                  step="0.01" 
                                  value={currentSubtotal.toFixed(2)} // Display calculated value
                                  onChange={(e) => {
                                      const newTotal = parseFloat(e.target.value);
                                      if (!isNaN(newTotal) && currentQty !== 0) {
                                          const newPrice = newTotal / currentQty;
                                          form.setValue(`lines.${index}.unitPrice`, Number(newPrice.toFixed(4))); // Update price, keeping precision
                                      }
                                  }}
                               />
                            </FormControl>
                         </FormItem>
                      </div>

                      <div className="col-span-4 md:col-span-1">
                        <FormField
                          control={form.control}
                          name={`lines.${index}.discountPercent`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={index > 0 ? "sr-only" : ""}>Disc %</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" min="0" max="100" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="col-span-12 md:col-span-1 flex justify-end">
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                 })}
                  {fields.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      No items added. Click &quot;Add Item&quot; to start.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} AED</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">VAT (5%)</span>
                  <span>{vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} AED</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Total</span>
                  <span>{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} AED</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {initialData ? "Update Invoice" : "Create Invoice"}
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
