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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plus, 
  Trash2, 
  Loader2, 
  ArrowLeft, 
  FileText, 
  Calendar, 
  User, 
  Package, 
  CheckCircle2,
  Receipt,
  TrendingUp,
  Eye
} from "lucide-react";
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
  
  // Success dialog state
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [savedInvoiceId, setSavedInvoiceId] = useState<string>("");
  const [savedInvoiceNumber, setSavedInvoiceNumber] = useState<string>("");

  const defaultValues: Partial<InvoiceFormValues> = initialData ? {
    customerId: initialData.customerId,
    invoiceDate: initialData.invoiceDate ? new Date(initialData.invoiceDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    salesOrderId: initialData.salesOrderId || "",
    notes: initialData.notes || "",
    lines: initialData.lines || [{ itemId: "", quantity: 1, unitPrice: 0, discountPercent: 0 }],
  } : {
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
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

  const isDirty = form.formState.isDirty;

  // Warn user when leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Reserve invoice number on mount
  useEffect(() => {
    const reserveNumber = async () => {
      if (initialData) {
        setReservedNumber(initialData.invoiceNumber || "");
        setNumberLoading(false);
        return;
      }
      try {
        const response = await fetch('/api/numbers/reserve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entityType: 'invoice', documentType: 'INV' }),
        });
        const data = await response.json();
        if (data.success && data.number) {
          setReservedNumber(data.number);
        }
      } catch (error) {
        console.error("Number reservation error:", error);
      } finally {
        setNumberLoading(false);
      }
    };
    reserveNumber();
  }, [initialData]);

  // Watch lines for calculation
  const watchedLines = form.watch("lines");
  
  const subtotal = watchedLines.reduce((sum, line) => {
    const lineTotal = (line.quantity || 0) * (line.unitPrice || 0);
    const discount = lineTotal * ((line.discountPercent || 0) / 100);
    return sum + lineTotal - discount;
  }, 0);
  
  const vatAmount = subtotal * 0.05;
  const totalAmount = subtotal + vatAmount;

  const onInvalid = (errors: any) => {
    console.error("Form validation errors:", errors);
    const firstError = Object.values(errors)[0] as any;
    if (firstError?.message) {
      toast.error(firstError.message);
    } else {
      toast.error("Please fill in all required fields");
    }
  };

  const onSubmit = async (data: InvoiceFormValues) => {
    if (loading) return;
    
    setLoading(true);
    
    try {
      const defaultWarehouse = warehouses[0]?.id || "";
      
      const mappedItems = data.lines.map(line => ({
        itemId: line.itemId,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discountPercent: line.discountPercent || 0,
        taxId: line.taxId,
      }));
      
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
      
      if (result && result.success) {
        // Show success dialog instead of toast
        setSavedInvoiceId(result.invoiceId || "");
        setSavedInvoiceNumber(result.invoiceNumber || reservedNumber);
        setShowSuccessDialog(true);
      } else {
        toast.error(result?.message || "Failed to create invoice");
      }
    } catch (error: any) {
      console.error("Invoice submission error:", error);
      toast.error(error.message || "Failed to create invoice");
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

  const handleQuantityChange = async (index: number, quantity: number) => {
    const itemId = form.getValues(`lines.${index}.itemId`);
    const selectedItem = items.find(i => i.id === itemId);
    if (selectedItem) {
      try {
        const tiered = await getTieredPrice(itemId, quantity, Number(selectedItem.sellingPrice || 0));
        form.setValue(`lines.${index}.unitPrice`, tiered.tieredPrice);
        setTierInfo(prev => ({ ...prev, [index]: { tierName: tiered.tierName, savings: tiered.savings, tierApplied: tiered.tierApplied } }));
      } catch {
        // Keep current price
      }
    }
  };

  return (
    <>
      {/* Success Confirmation Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <DialogTitle className="text-xl">Invoice Created Successfully!</DialogTitle>
            <DialogDescription className="text-base">
              Invoice <span className="font-semibold text-foreground">{savedInvoiceNumber}</span> has been created and saved.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 p-4 dark:from-green-900/20 dark:to-emerald-900/20">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Amount</span>
              <span className="text-lg font-bold text-green-600">{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} AED</span>
            </div>
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => {
                setShowSuccessDialog(false);
                form.reset(defaultValues);
                setReservedNumber("");
                // Re-reserve a new number
                fetch('/api/numbers/reserve', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ entityType: 'invoice', documentType: 'INV' }),
                }).then(res => res.json()).then(data => {
                  if (data.success) setReservedNumber(data.number);
                });
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Another
            </Button>
            <Button 
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              onClick={() => {
                setShowSuccessDialog(false);
                router.push("/sales/invoices");
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              View All Invoices
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
          {/* Premium Gradient Header */}
          <div className="rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white shadow-lg">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/20"
                  onClick={() => router.back()}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <div className="flex items-center gap-3">
                    <FileText className="h-6 w-6" />
                    <h1 className="text-2xl font-bold">
                      {initialData ? "Edit Invoice" : "New Invoice"}
                    </h1>
                  </div>
                  {numberLoading ? (
                    <div className="mt-1 flex items-center gap-2 text-sm text-white/80">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Reserving number...</span>
                    </div>
                  ) : reservedNumber && (
                    <Badge className="mt-2 bg-white/20 text-white hover:bg-white/30 text-sm px-3 py-1">
                      {reservedNumber}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isDirty && (
                  <Badge variant="secondary" className="bg-amber-500/20 text-amber-100 animate-pulse">
                    <span className="mr-1 h-2 w-2 rounded-full bg-amber-300" />
                    Unsaved changes
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Form Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer & Dates Card */}
              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5 text-blue-500" />
                    Customer & Dates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="customerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Customer *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-11">
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
                          <FormLabel className="flex items-center gap-2 text-sm font-medium">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            Invoice Date *
                          </FormLabel>
                          <FormControl>
                            <Input type="date" className="h-11" {...field} />
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
                          <FormLabel className="flex items-center gap-2 text-sm font-medium">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            Due Date *
                          </FormLabel>
                          <FormControl>
                            <Input type="date" className="h-11" {...field} />
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
                          <FormLabel className="text-sm font-medium">Notes</FormLabel>
                          <FormControl>
                            <Input placeholder="Internal notes..." className="h-11" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Line Items Card */}
              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Package className="h-5 w-5 text-purple-500" />
                      Line Items
                      {reservedNumber && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {reservedNumber}
                        </Badge>
                      )}
                    </CardTitle>
                    <Button 
                      type="button" 
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => append({ itemId: "", quantity: 1, unitPrice: 0, discountPercent: 0 })}
                    >
                      <Plus className="h-4 w-4" />
                      Add Item
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Table Header */}
                  <div className="hidden md:grid grid-cols-12 gap-3 mb-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <div className="col-span-4">Item</div>
                    <div className="col-span-2">Qty</div>
                    <div className="col-span-2">Price</div>
                    <div className="col-span-2">Subtotal</div>
                    <div className="col-span-1">Disc %</div>
                    <div className="col-span-1"></div>
                  </div>

                  <div className="space-y-3">
                    {fields.map((field, index) => {
                      const line = watchedLines[index];
                      const lineSubtotal = (line?.quantity || 0) * (line?.unitPrice || 0);
                      const lineDiscount = lineSubtotal * ((line?.discountPercent || 0) / 100);
                      const lineTotal = lineSubtotal - lineDiscount;
                      
                      return (
                        <div 
                          key={field.id} 
                          className="grid grid-cols-12 gap-3 items-end p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-border/50"
                        >
                          {/* Item Select */}
                          <div className="col-span-12 md:col-span-4">
                            <FormField
                              control={form.control}
                              name={`lines.${index}.itemId`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className={index > 0 ? "sr-only" : "md:sr-only"}>Item</FormLabel>
                                  <Select 
                                    onValueChange={(val) => { field.onChange(val); handleItemChange(index, val); }}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="h-10">
                                        <SelectValue placeholder="Select item..." />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {items.map((i) => (
                                        <SelectItem key={i.id} value={i.id}>
                                          <span className="font-medium">{i.sku}</span>
                                          <span className="mx-2 text-muted-foreground">-</span>
                                          <span className="text-sm">{i.name}</span>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Quantity */}
                          <div className="col-span-4 md:col-span-2">
                            <FormField
                              control={form.control}
                              name={`lines.${index}.quantity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className={index > 0 ? "sr-only" : "md:sr-only"}>Qty</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      step="1" 
                                      min="1" 
                                      className="h-10 text-center"
                                      {...field} 
                                      onChange={e => {
                                        const qty = parseInt(e.target.value) || 1;
                                        field.onChange(qty);
                                        handleQuantityChange(index, qty);
                                      }} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Unit Price */}
                          <div className="col-span-4 md:col-span-2">
                            <FormField
                              control={form.control}
                              name={`lines.${index}.unitPrice`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className={index > 0 ? "sr-only" : "md:sr-only"}>Price</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      step="0.01" 
                                      min="0" 
                                      className="h-10"
                                      {...field} 
                                      onChange={e => field.onChange(parseFloat(e.target.value) || 0)} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Subtotal (readonly) */}
                          <div className="col-span-4 md:col-span-2">
                            <FormItem>
                              <FormLabel className={index > 0 ? "sr-only" : "md:sr-only"}>Subtotal</FormLabel>
                              <div className="h-10 px-3 py-2 rounded-md bg-background border text-right font-medium">
                                {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </div>
                            </FormItem>
                          </div>

                          {/* Discount */}
                          <div className="col-span-8 md:col-span-1">
                            <FormField
                              control={form.control}
                              name={`lines.${index}.discountPercent`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className={index > 0 ? "sr-only" : "md:sr-only"}>Disc %</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      step="0.01" 
                                      min="0" 
                                      max="100" 
                                      className="h-10 text-center"
                                      {...field} 
                                      onChange={e => field.onChange(parseFloat(e.target.value) || 0)} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Delete Button */}
                          <div className="col-span-4 md:col-span-1 flex justify-end">
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="h-10 w-10 text-destructive hover:bg-destructive/10"
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}

                    {fields.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No items added yet</p>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          className="mt-3"
                          onClick={() => append({ itemId: "", quantity: 1, unitPrice: 0, discountPercent: 0 })}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add First Item
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary Sidebar */}
            <div className="space-y-6">
              {/* Summary Card */}
              <Card className="shadow-md sticky top-4">
                <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-t-lg">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Receipt className="h-5 w-5 text-green-500" />
                    Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} AED</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">VAT (5%)</span>
                      <span className="font-medium">{vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} AED</span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Total</span>
                        <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} AED
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions Card */}
              <Card className="shadow-md">
                <CardContent className="pt-6 space-y-3">
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Creating Invoice...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        {initialData ? "Update Invoice" : "Create Invoice"}
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full h-11" 
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-muted-foreground">Items</p>
                      <p className="text-lg font-semibold">{fields.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </>
  );
}
