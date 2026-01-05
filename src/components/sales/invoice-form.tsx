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
  Eye,
  ToggleLeft,
  Search,
  ChevronsUpDown,
  Check
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { createInvoiceAction } from "@/actions/sales/create-invoice";
import { addDays, format, parseISO } from "date-fns";
import { getTieredPrice } from "@/lib/services/tiered-pricing-service";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  salesmanId: z.string().optional(),
  invoiceDate: z.string().min(1, "Date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  salesOrderId: z.string().optional(),
  paymentTerms: z.string().optional(),
  paymentMode: z.string().optional(),
  termsAndConditions: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(z.object({
    itemId: z.string().min(1, "Item is required"),
    quantity: z.number().min(0.001, "Quantity required"),
    unitPrice: z.number().min(0, "Price required"),
    discountAmount: z.number().min(0).optional(), // Changed from % to AED amount
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
  salesmen?: any[];
  initialData?: any;
}

export function InvoiceForm({ customers, items, warehouses, taxes, salesmen = [], initialData }: InvoiceFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [reservedNumber, setReservedNumber] = useState<string>("");
  const [numberLoading, setNumberLoading] = useState(!initialData);
  
  // Success dialog state
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [savedInvoiceId, setSavedInvoiceId] = useState<string>("");
  const [savedInvoiceNumber, setSavedInvoiceNumber] = useState<string>("");
  
  // Tax inclusive toggle - when true, entered amounts include VAT
  const [isTaxInclusive, setIsTaxInclusive] = useState(false);
  
  // Track selected/focused line for showing item details
  const [selectedLineIndex, setSelectedLineIndex] = useState<number | null>(null);
  
  // Overall invoice discount (editable in summary, applied before VAT)
  const [overallDiscount, setOverallDiscount] = useState<number>(0);

  const defaultValues: Partial<InvoiceFormValues> = initialData ? {
    customerId: initialData.customerId,
    invoiceDate: initialData.invoiceDate ? new Date(initialData.invoiceDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    salesOrderId: initialData.salesOrderId || "",
    notes: initialData.notes || "",
    lines: initialData.lines || [{ itemId: "", quantity: 1, unitPrice: 0, discountAmount: 0 }],
  } : {
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    lines: [{ itemId: "", quantity: 1, unitPrice: 0, discountAmount: 0 }],
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
        } else if (data.error) {
          console.error("Number reservation error:", data.error);
          if (data.error.includes("Unauthorized")) {
            toast.error("Session expired. Please log in again.");
            setReservedNumber("Login Required");
          }
        }
      } catch (error) {
        console.error("Number reservation error:", error);
        toast.error("Failed to reserve invoice number");
      } finally {
        setNumberLoading(false);
      }
    };
    reserveNumber();
  }, [initialData]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        form.handleSubmit(onSubmit, onInvalid)();
        toast.info("Saving invoice...");
      }
      // Ctrl+N or Cmd+N to add new line
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        append({ itemId: "", quantity: 1, unitPrice: 0, discountAmount: 0 });
        toast.info("New line added");
      }
      // Escape to deselect line
      if (e.key === 'Escape') {
        setSelectedLineIndex(null);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [form, append]);

  // Watch lines for calculation
  const watchedLines = form.watch("lines");
  
  // VAT rate
  const VAT_RATE = 0.05;
  
  // Calculate totals - discount is now AED amount, not percentage
  const grossTotal = watchedLines.reduce((sum, line) => {
    return sum + (line.quantity || 0) * (line.unitPrice || 0);
  }, 0);
  
  // Line discounts = sum of discountAmount from each line
  const lineDiscounts = watchedLines.reduce((sum, line) => {
    return sum + (line.discountAmount || 0);
  }, 0);
  
  // Total discount = line discounts + overall invoice discount
  const totalDiscount = lineDiscounts + overallDiscount;
  
  // Net after all discounts, BEFORE VAT
  const netAfterDiscount = grossTotal - totalDiscount;
  
  // If tax inclusive, back-calculate the taxable amount
  const subtotal = isTaxInclusive ? netAfterDiscount / (1 + VAT_RATE) : netAfterDiscount;
  const vatAmount = subtotal * VAT_RATE;
  const totalAmount = isTaxInclusive ? netAfterDiscount : subtotal + vatAmount;

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
      const defaultTaxRate = 5; // 5% VAT
      
      const mappedItems = data.lines.map(line => {
        const lineSub = line.quantity * line.unitPrice;
        const discountAmount = lineSub * ((line.discountPercent || 0) / 100);
        const taxableAmount = lineSub - discountAmount;
        const taxAmount = taxableAmount * (defaultTaxRate / 100);
        const totalAmount = taxableAmount + taxAmount;
        
        return {
          itemId: line.itemId,
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          discountAmount: discountAmount,
          taxRate: defaultTaxRate,
          taxAmount: taxAmount,
          totalAmount: totalAmount,
        };
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

          <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
            {/* Main Form Section */}
            <div className="space-y-4">
              {/* Compact Header Card - All key fields */}
              <Card className="shadow-sm">
                <CardContent className="pt-4 pb-3">
                  {/* Row 1: Invoice #, Customer, Salesman, Dates */}
                  <div className="grid grid-cols-5 gap-3 mb-3">
                    {/* Invoice Number */}
                    <div>
                      <span className="text-xs text-muted-foreground">Invoice #</span>
                      <div className="h-9 px-3 py-2 rounded-md bg-blue-50 dark:bg-blue-900/30 text-sm font-bold text-blue-700">
                        {numberLoading ? "..." : reservedNumber || "Auto"}
                      </div>
                    </div>

                    {/* Customer */}
                    <FormField
                      control={form.control}
                      name="customerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Customer *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-9 text-sm">
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {customers.map((c) => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    {/* Salesman */}
                    <FormField
                      control={form.control}
                      name="salesmanId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Salesman</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-9 text-sm">
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {salesmen.map((s) => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    {/* Invoice Date */}
                    <FormField
                      control={form.control}
                      name="invoiceDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Date *</FormLabel>
                          <FormControl>
                            <Input type="date" className="h-9 text-sm" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Due Date */}
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Due *</FormLabel>
                          <FormControl>
                            <Input type="date" className="h-9 text-sm" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Row 2: Payment Terms, Mode, Tax Inclusive Toggle */}
                  <div className="grid grid-cols-4 gap-3">
                    {/* Payment Terms */}
                    <FormField
                      control={form.control}
                      name="paymentTerms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Payment Terms</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-9 text-sm">
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="due_on_receipt">Due on Receipt</SelectItem>
                              <SelectItem value="net_7">Net 7</SelectItem>
                              <SelectItem value="net_15">Net 15</SelectItem>
                              <SelectItem value="net_30">Net 30</SelectItem>
                              <SelectItem value="net_60">Net 60</SelectItem>
                              <SelectItem value="net_90">Net 90</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    {/* Mode of Payment */}
                    <FormField
                      control={form.control}
                      name="paymentMode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Payment Mode</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-9 text-sm">
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="card">Card</SelectItem>
                              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                              <SelectItem value="cheque">Cheque</SelectItem>
                              <SelectItem value="credit">Credit</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    {/* Notes */}
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Notes</FormLabel>
                          <FormControl>
                            <Input placeholder="Internal..." className="h-9 text-sm" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Tax Toggle */}
                    <div className="flex items-end gap-2 pb-1">
                      <Switch
                        id="tax-inclusive"
                        checked={isTaxInclusive}
                        onCheckedChange={setIsTaxInclusive}
                      />
                      <Label htmlFor="tax-inclusive" className="text-xs cursor-pointer">
                        Tax Inclusive
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Line Items Card - Premium Layout */}
              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Package className="h-5 w-5 text-purple-500" />
                      Line Items
                      {fields.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {fields.length} item{fields.length !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </CardTitle>
                    <Button 
                      type="button" 
                      className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                      size="sm"
                      onClick={() => append({ itemId: "", quantity: 1, unitPrice: 0, discountAmount: 0 })}
                    >
                      <Plus className="h-4 w-4" />
                      Add Item
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    {fields.map((field, index) => {
                      const line = watchedLines[index];
                      const selectedItem = items.find(i => i.id === line?.itemId);
                      const itemCost = Number(selectedItem?.costPrice || 0);
                      const lineSubtotal = (line?.quantity || 0) * (line?.unitPrice || 0);
                      const lineDiscountAmt = line?.discountAmount || 0;
                      const lineNetAmount = lineSubtotal - lineDiscountAmt;
                      
                      return (
                        <div key={field.id}>
                          {/* Line Item Card - Compact */}
                          <div 
                            className={`rounded-lg border p-3 cursor-pointer transition-all ${
                              selectedLineIndex === index 
                                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-md' 
                                : 'border-border/60 bg-white dark:bg-slate-900/50 hover:border-blue-200'
                            }`}
                            onClick={() => setSelectedLineIndex(index)}
                          >
                            {/* Compact Header: + Add | Line # | Item Select | Delete */}
                            <div className="flex items-center gap-2 mb-2">
                              {/* Insert Line Before - Simple + */}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-green-600 hover:bg-green-100 hover:text-green-700 shrink-0"
                                title="Insert line above"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newItem = { itemId: "", quantity: 1, unitPrice: 0, discountAmount: 0 };
                                  const currentLines = form.getValues("lines");
                                  const newLines = [...currentLines.slice(0, index), newItem, ...currentLines.slice(index)];
                                  form.setValue("lines", newLines);
                                  setSelectedLineIndex(index);
                                }}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              
                              <Badge variant="outline" className="text-xs shrink-0">
                                #{index + 1}
                              </Badge>
                              
                              {/* Item Selection - Searchable Combobox */}
                              <FormField
                                control={form.control}
                                name={`lines.${index}.itemId`}
                                render={({ field }) => {
                                  const currentItem = items.find(i => i.id === field.value);
                                  const [open, setOpen] = useState(false);
                                  return (
                                    <FormItem className="flex-1">
                                      <Popover open={open} onOpenChange={setOpen}>
                                        <PopoverTrigger asChild>
                                          <FormControl>
                                            <Button
                                              variant="outline"
                                              role="combobox"
                                              aria-expanded={open}
                                              className={cn(
                                                "h-9 w-full justify-between text-sm font-normal",
                                                !field.value && "text-muted-foreground"
                                              )}
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <span className="truncate">
                                                {currentItem ? currentItem.name : "Search items..."}
                                              </span>
                                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                          </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[400px] p-0" align="start">
                                          <Command>
                                            <CommandInput placeholder="Search by name or SKU..." />
                                            <CommandList>
                                              <CommandEmpty>No items found.</CommandEmpty>
                                              <CommandGroup>
                                                {items.map((item) => (
                                                  <CommandItem
                                                    key={item.id}
                                                    value={`${item.name} ${item.sku || ''}`}
                                                    onSelect={() => {
                                                      field.onChange(item.id);
                                                      handleItemChange(index, item.id);
                                                      setSelectedLineIndex(index);
                                                      setOpen(false); // Close dropdown
                                                      // Focus quantity input after short delay
                                                      setTimeout(() => {
                                                        const qtyInput = document.querySelector(`input[name="lines.${index}.quantity"]`) as HTMLInputElement;
                                                        qtyInput?.focus();
                                                        qtyInput?.select();
                                                      }, 100);
                                                    }}
                                                  >
                                                    <Check
                                                      className={cn(
                                                        "mr-2 h-4 w-4",
                                                        field.value === item.id ? "opacity-100" : "opacity-0"
                                                      )}
                                                    />
                                                    <div className="flex flex-col">
                                                      <span className="font-medium">{item.name}</span>
                                                      <span className="text-xs text-muted-foreground">
                                                        SKU: {item.sku || 'N/A'} | Price: {Number(item.sellingPrice || 0).toFixed(2)}
                                                      </span>
                                                    </div>
                                                  </CommandItem>
                                                ))}
                                              </CommandGroup>
                                            </CommandList>
                                          </Command>
                                        </PopoverContent>
                                      </Popover>
                                      <FormMessage />
                                    </FormItem>
                                  );
                                }}
                              />
                              
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 shrink-0"
                                onClick={(e) => { e.stopPropagation(); remove(index); }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Qty, Rate, Gross, Disc, Net - Compact Row */}
                            <div className="grid grid-cols-5 gap-2">
                              {/* Qty */}
                              <FormField
                                control={form.control}
                                name={`lines.${index}.quantity`}
                                render={({ field }) => (
                                  <div>
                                    <span className="text-[10px] text-muted-foreground uppercase">Qty</span>
                                    <Input 
                                      type="number" 
                                      step="1" 
                                      min="1" 
                                      className="h-8 text-center text-sm"
                                      {...field} 
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={e => {
                                        const qty = parseInt(e.target.value) || 1;
                                        field.onChange(qty);
                                        handleQuantityChange(index, qty);
                                      }} 
                                    />
                                  </div>
                                )}
                              />

                              {/* Rate */}
                              <FormField
                                control={form.control}
                                name={`lines.${index}.unitPrice`}
                                render={({ field }) => (
                                  <div>
                                    <span className="text-[10px] text-muted-foreground uppercase">Rate</span>
                                    <Input 
                                      type="number" 
                                      step="0.01" 
                                      min="0" 
                                      className="h-8 text-right text-sm"
                                      {...field} 
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={e => field.onChange(parseFloat(e.target.value) || 0)} 
                                    />
                                  </div>
                                )}
                              />

                              {/* Gross - Read Only */}
                              <div>
                                <span className="text-[10px] text-muted-foreground uppercase">Gross</span>
                                <div className="h-8 px-2 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-right text-sm font-medium">
                                  {lineSubtotal.toFixed(2)}
                                </div>
                              </div>

                              {/* Disc Amount (AED) */}
                              <FormField
                                control={form.control}
                                name={`lines.${index}.discountAmount`}
                                render={({ field }) => (
                                  <div>
                                    <span className="text-[10px] text-muted-foreground uppercase">Disc (AED)</span>
                                    <Input 
                                      type="number" 
                                      step="0.01" 
                                      min="0" 
                                      className="h-8 text-center text-sm"
                                      placeholder="0"
                                      {...field} 
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={e => field.onChange(parseFloat(e.target.value) || 0)} 
                                    />
                                  </div>
                                )}
                              />

                              {/* Net */}
                              <div>
                                <span className="text-[10px] text-muted-foreground uppercase">Net</span>
                                <div className="h-8 px-2 py-1.5 rounded-md bg-green-100 dark:bg-green-900/30 text-right text-sm font-bold text-green-700 dark:text-green-400">
                                  {lineNetAmount.toFixed(2)}
                                </div>
                              </div>
                            </div>

                            {/* Cost/Sell/Margin/Qty - Always visible, smaller */}
                            {selectedItem && (
                              <div className="mt-1.5 flex items-center gap-3 text-[10px] text-muted-foreground">
                                <span>Cost: <strong className="text-blue-600">{itemCost.toFixed(2)}</strong></span>
                                <span>Sell: <strong className="text-green-600">{Number(selectedItem.sellingPrice || 0).toFixed(2)}</strong></span>
                                <span>Margin: <strong className={((Number(line?.unitPrice || 0) - itemCost) / (itemCost || 1) * 100) > 0 ? 'text-green-600' : 'text-red-600'}>{((Number(line?.unitPrice || 0) - itemCost) / (itemCost || 1) * 100).toFixed(0)}%</strong></span>
                                <span>Avl: <strong>∞</strong></span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {fields.length === 0 && (
                      <div className="text-center py-12 border-2 border-dashed rounded-xl">
                        <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                        <p className="text-lg text-muted-foreground mb-2">No items added yet</p>
                        <p className="text-sm text-muted-foreground mb-4">Click the button below to add your first item</p>
                        <Button 
                          type="button" 
                          className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                          onClick={() => append({ itemId: "", quantity: 1, unitPrice: 0, discountAmount: 0 })}
                        >
                          <Plus className="h-4 w-4" />
                          Add First Item
                        </Button>
                      </div>
                    )}

                    {/* Add Item at End */}
                    {fields.length > 0 && (
                      <div className="flex justify-center pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="gap-2 border-dashed hover:border-green-500 hover:text-green-600"
                          onClick={() => append({ itemId: "", quantity: 1, unitPrice: 0, discountAmount: 0 })}
                        >
                          <Plus className="h-4 w-4" />
                          Add Another Item
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary Sidebar - Sticky */}
            <div className="lg:sticky lg:top-4 lg:self-start space-y-4">
              {/* Keyboard Shortcuts Hint */}
              <div className="text-xs text-muted-foreground bg-slate-100 dark:bg-slate-800 rounded-lg p-2">
                <p>⌨️ <strong>Ctrl+S</strong> Save | <strong>Ctrl+N</strong> Add Line | <strong>Esc</strong> Deselect</p>
              </div>
              
              {/* Summary Card */}
              <Card className="shadow-md">
                <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Receipt className="h-5 w-5 text-green-500" />
                      Summary
                    </CardTitle>
                    {isTaxInclusive && (
                      <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                        Tax Incl.
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="space-y-2">
                    {/* Gross Amount */}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Gross Amount</span>
                      <span className="font-medium">{grossTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} AED</span>
                    </div>
                    
                    {/* Line Discounts (read-only, from line items) */}
                    {lineDiscounts > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Line Discounts</span>
                        <span className="font-medium text-orange-500">-{lineDiscounts.toLocaleString(undefined, { minimumFractionDigits: 2 })} AED</span>
                      </div>
                    )}
                    
                    {/* Overall Discount - Editable */}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-orange-600 font-medium">Discount</span>
                      <div className="flex items-center gap-1">
                        <span className="text-orange-600">-</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className="h-7 w-24 text-right text-sm text-orange-600 font-medium"
                          value={overallDiscount}
                          onChange={(e) => setOverallDiscount(parseFloat(e.target.value) || 0)}
                        />
                        <span className="text-xs text-muted-foreground">AED</span>
                      </div>
                    </div>
                    
                    {/* Total Discount summary */}
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Total Discount</span>
                      <span>-{totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })} AED</span>
                    </div>
                    
                    {/* Subtotal (after discount, before VAT) */}
                    <div className="flex justify-between text-sm border-t pt-2">
                      <span className="text-muted-foreground font-medium">Taxable Amount</span>
                      <span className="font-semibold">{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} AED</span>
                    </div>
                    
                    {/* VAT */}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">VAT (5%)</span>
                      <span className="font-medium">{vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} AED</span>
                    </div>
                    
                    {/* Grand Total */}
                    <div className="border-t-2 border-primary/20 pt-3 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold">Total Amount</span>
                        <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} AED
                        </span>
                      </div>
                    </div>
                    
                    {/* Savings indicator */}
                    {totalDiscount > 0 && (
                      <div className="text-center py-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <span className="text-xs text-green-600 dark:text-green-400">
                          💰 Customer saves {totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })} AED
                        </span>
                      </div>
                    )}
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
