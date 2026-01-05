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
  ClipboardList, 
  Calendar, 
  User, 
  Package, 
  CheckCircle2,
  Receipt,
  TrendingUp,
  Eye,
  Search,
  ChevronsUpDown,
  Check
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { createSalesOrderAction } from "@/actions/sales/create-sales-order";
import { getTieredPrice } from "@/lib/services/tiered-pricing-service";
import { Badge } from "@/components/ui/badge";
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
  orderDate: z.string().min(1, "Date is required"),
  deliveryDate: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(z.object({
    itemId: z.string().min(1, "Item is required"),
    uomId: z.string().optional(),
    quantity: z.number().min(0.001, "Quantity required"),
    unitPrice: z.number().min(0, "Price required"),
    discountAmount: z.number().min(0).optional(),
    description: z.string().optional(),
  })).min(1, "At least one item is required"),
});

type SalesOrderFormValues = z.infer<typeof formSchema>;

interface SalesOrderFormProps {
  customers: any[];
  items: any[];
  warehouses?: any[];
  salesmen?: any[];
  initialData?: any;
}

export function SalesOrderForm({ customers, items, warehouses = [], salesmen = [], initialData }: SalesOrderFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [reservedNumber, setReservedNumber] = useState<string>("");
  const [numberLoading, setNumberLoading] = useState(!initialData);
  
  // Success dialog state
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [savedOrderId, setSavedOrderId] = useState<string>("");
  const [savedOrderNumber, setSavedOrderNumber] = useState<string>("");
  
  // Track selected/focused line for showing item details
  const [selectedLineIndex, setSelectedLineIndex] = useState<number | null>(null);
  
  // Overall order discount (editable in summary, applied before VAT)
  const [overallDiscount, setOverallDiscount] = useState<number>(0);

  const defaultValues: Partial<SalesOrderFormValues> = initialData ? {
    customerId: initialData.customerId,
    orderDate: initialData.orderDate ? new Date(initialData.orderDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    deliveryDate: initialData.deliveryDate ? new Date(initialData.deliveryDate).toISOString().split('T')[0] : "",
    reference: initialData.reference || "",
    notes: initialData.notes || "",
    lines: initialData.lines || [{ itemId: "", uomId: "", quantity: 1, unitPrice: 0, discountAmount: 0 }],
  } : {
    orderDate: new Date().toISOString().split('T')[0],
    lines: [{ itemId: "", uomId: "", quantity: 1, unitPrice: 0, discountAmount: 0 }],
  };

  const form = useForm<SalesOrderFormValues>({
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

  // Reserve order number on mount
  useEffect(() => {
    const reserveNumber = async () => {
      if (initialData) {
        setReservedNumber(initialData.orderNumber || "");
        setNumberLoading(false);
        return;
      }
      try {
        const response = await fetch('/api/numbers/reserve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entityType: 'sales_order', documentType: 'SO' }),
        });
        const data = await response.json();
        if (data.success && data.number) {
          setReservedNumber(data.number);
        } else if (data.error) {
           if (data.error.includes("Unauthorized")) {
             setReservedNumber("Login Required");
           }
        }
      } catch (error) {
        console.error("Number reservation error:", error);
      } finally {
        setNumberLoading(false);
      }
    };
    reserveNumber();
  }, [initialData]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        form.handleSubmit(onSubmit, onInvalid)();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [form]);

  // Watch lines for calculation
  const watchedLines = form.watch("lines");
  
  // VAT rate
  const VAT_RATE = 0.05;
  
  // Calculate totals
  const grossTotal = watchedLines.reduce((sum, line) => {
    return sum + (line.quantity || 0) * (line.unitPrice || 0);
  }, 0);
  
  const lineDiscounts = watchedLines.reduce((sum, line) => {
    return sum + (line.discountAmount || 0);
  }, 0);
  
  const totalDiscount = lineDiscounts + overallDiscount;
  const taxableAmount = grossTotal - totalDiscount;
  const vatAmount = taxableAmount * VAT_RATE;
  const totalAmount = taxableAmount + vatAmount;

  const onInvalid = (errors: any) => {
    const firstError = Object.values(errors)[0] as any;
    if (firstError?.message) {
      toast.error(firstError.message);
    } else {
      toast.error("Please fill in all required fields");
    }
  };

  const onSubmit = async (data: SalesOrderFormValues) => {
    if (loading) return;
    setLoading(true);
    
    try {
      const defaultWarehouse = warehouses[0]?.id || ""; // Handle empty warehouses
      
      const mappedItems = data.lines.map(line => {
        const lineSub = line.quantity * line.unitPrice;
        const discountAmount = line.discountAmount || 0;
        const discountPercent = lineSub > 0 ? (discountAmount / lineSub) * 100 : 0;
        
        return {
          itemId: line.itemId,
          description: line.description,
          quantity: line.quantity,
          uom: line.uomId || "PCS",
          unitPrice: line.unitPrice,
          discountPercent: discountPercent, // Action expects percent
          taxPercent: 5 // Default 5%
        };
      });
      
      const subtotalBeforeOverall = grossTotal - lineDiscounts;
      const overallDiscountPercent = subtotalBeforeOverall > 0 ? (overallDiscount / subtotalBeforeOverall) * 100 : 0;

      const result = await createSalesOrderAction({
        customerId: data.customerId,
        warehouseId: defaultWarehouse,
        orderDate: data.orderDate,
        deliveryDate: data.deliveryDate,
        reference: data.reference,
        notes: data.notes,
        discountPercent: overallDiscountPercent,
        lines: mappedItems,
      });
      
      if (result && result.success) {
        setSavedOrderId(result.data?.id || "");
        setSavedOrderNumber(result.data?.orderNumber || reservedNumber);
        setShowSuccessDialog(true);
      } else {
        toast.error(result?.message || "Failed to create sales order");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create sales order");
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = async (index: number, itemId: string) => {
    const selectedItem = items.find(i => i.id === itemId);
    if (selectedItem) {
      form.setValue(`lines.${index}.unitPrice`, Number(selectedItem.sellingPrice || 0));
      form.setValue(`lines.${index}.uomId`, selectedItem.uom || "PCS");
      
      // Auto-set description if empty? (Optional)
    }
  };

  return (
    <>
      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <DialogTitle className="text-xl">Sales Order Created!</DialogTitle>
            <DialogDescription className="text-base">
              Order <span className="font-semibold text-foreground">{savedOrderNumber}</span> has been created successfully.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => {
                setShowSuccessDialog(false);
                form.reset(defaultValues);
                setReservedNumber("");
                // Re-reserve
                fetch('/api/numbers/reserve', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ entityType: 'sales_order', documentType: 'SO' }),
                }).then(res => res.json()).then(data => {
                  if (data.success) setReservedNumber(data.number);
                });
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Another
            </Button>
            <Button 
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600"
              onClick={() => {
                setShowSuccessDialog(false);
                router.push("/sales/orders");
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Orders
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
           {/* Premium Gradient Header */}
           <div className="rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-red-600 p-6 text-white shadow-lg">
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
                    <ClipboardList className="h-6 w-6" />
                    <h1 className="text-2xl font-bold">
                      {initialData ? "Edit Sales Order" : "New Sales Order"}
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
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
            {/* Main Form Section */}
            <div className="space-y-4">
              {/* Header Details */}
              <Card className="shadow-sm">
                <CardContent className="pt-4 pb-3">
                  <div className="grid grid-cols-4 gap-3 mb-3">
                     <div>
                      <span className="text-xs text-muted-foreground">Order #</span>
                      <div className="h-9 px-3 py-2 rounded-md bg-pink-50 dark:bg-pink-900/30 text-sm font-bold text-pink-700">
                        {numberLoading ? "..." : reservedNumber || "Auto"}
                      </div>
                    </div>

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

                    <FormField
                      control={form.control}
                      name="orderDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Order Date *</FormLabel>
                          <FormControl>
                            <Input type="date" className="h-9 text-sm" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="deliveryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Delivery Date</FormLabel>
                          <FormControl>
                            <Input type="date" className="h-9 text-sm" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                     <FormField
                      control={form.control}
                      name="reference"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Reference</FormLabel>
                          <FormControl>
                            <Input placeholder="PO #..." className="h-9 text-sm" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Notes</FormLabel>
                          <FormControl>
                            <Input placeholder="Internal notes..." className="h-9 text-sm" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Line Items */}
              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4 border-b">
                   <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Package className="h-5 w-5 text-purple-500" />
                      Line Items
                      {fields.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {fields.length} items
                        </Badge>
                      )}
                    </CardTitle>
                    <Button 
                      type="button" 
                      className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                      size="sm"
                      onClick={() => append({ itemId: "", uomId: "", quantity: 1, unitPrice: 0, discountAmount: 0 })}
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
                       return (
                         <div key={field.id} className={`rounded-lg border p-3 cursor-pointer transition-all ${selectedLineIndex === index ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`} onClick={() => setSelectedLineIndex(index)}>
                            {/* Header Row */}
                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-xs shrink-0">#{index + 1}</Badge>
                                <FormField
                                  control={form.control}
                                  name={`lines.${index}.itemId`}
                                  render={({ field }) => (
                                    <FormItem className="flex-1">
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <FormControl>
                                            <Button variant="outline" role="combobox" className={cn("h-8 w-full justify-between text-xs", !field.value && "text-muted-foreground")}>
                                              {field.value ? items.find((i) => i.id === field.value)?.name : "Select Item..."}
                                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                          </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[400px] p-0" align="start">
                                          <Command>
                                            <CommandInput placeholder="Search item..." />
                                            <CommandList>
                                              <CommandEmpty>No item found.</CommandEmpty>
                                              <CommandGroup>
                                                {items.map((item) => (
                                                  <CommandItem
                                                    key={item.id}
                                                    value={item.name}
                                                    onSelect={() => {
                                                      field.onChange(item.id);
                                                      handleItemChange(index, item.id);
                                                    }}
                                                  >
                                                    <Check className={cn("mr-2 h-4 w-4", item.id === field.value ? "opacity-100" : "opacity-0")} />
                                                    <div className="flex flex-col">
                                                        <span className="font-medium uppercase">{String(item.name).toUpperCase()}</span>
                                                        <span className="text-xs text-muted-foreground">SKU: {item.sku} | Price: {item.sellingPrice}</span>
                                                    </div>
                                                  </CommandItem>
                                                ))}
                                              </CommandGroup>
                                            </CommandList>
                                          </Command>
                                        </PopoverContent>
                                      </Popover>
                                    </FormItem>
                                  )}
                                />
                                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={(e) => { e.stopPropagation(); remove(index); }}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Data Row */}
                            <div className="grid grid-cols-6 gap-2">
                                <FormField
                                  control={form.control}
                                  name={`lines.${index}.uomId`}
                                  render={({ field }) => {
                                     // Helper for UOM options
                                     const itemUom = selectedItem?.uom || "PCS";
                                     const itemUnits = selectedItem?.units || [];
                                     const availableUoms = [{ id: itemUom, name: itemUom }, ...itemUnits.map((u: any) => ({ id: u.uom, name: u.uom }))];
                                     
                                     return (
                                      <FormItem>
                                        <FormLabel className="text-[10px] text-muted-foreground">UOM</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || itemUom}>
                                          <FormControl>
                                            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            {availableUoms.map(u => <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>)}
                                          </SelectContent>
                                        </Select>
                                      </FormItem>
                                    );
                                  }}
                                />
                                
                                <FormField control={form.control} name={`lines.${index}.quantity`} render={({ field }) => (
                                   <FormItem>
                                     <FormLabel className="text-[10px] text-muted-foreground">QTY</FormLabel>
                                     <FormControl><Input type="number" className="h-8 text-sm" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl>
                                   </FormItem>
                                )} />

                                <FormField control={form.control} name={`lines.${index}.unitPrice`} render={({ field }) => (
                                   <FormItem>
                                     <FormLabel className="text-[10px] text-muted-foreground">RATE</FormLabel>
                                     <FormControl><Input type="number" className="h-8 text-sm" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl>
                                   </FormItem>
                                )} />

                                {/* Gross */}
                                <div className="space-y-2">
                                    <Label className="text-[10px] text-muted-foreground">GROSS</Label>
                                    <div className="h-8 flex items-center px-3 border rounded-md bg-muted/20 text-sm">
                                        {((watchedLines[index]?.quantity || 0) * (watchedLines[index]?.unitPrice || 0)).toFixed(2)}
                                    </div>
                                </div>

                                <FormField control={form.control} name={`lines.${index}.discountAmount`} render={({ field }) => (
                                   <FormItem>
                                     <FormLabel className="text-[10px] text-muted-foreground">DISC (AED)</FormLabel>
                                     <FormControl><Input type="number" className="h-8 text-sm text-red-600" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl>
                                   </FormItem>
                                )} />

                                {/* Net */}
                                <div className="space-y-2">
                                    <Label className="text-[10px] text-muted-foreground">NET</Label>
                                    <div className="h-8 flex items-center px-3 border rounded-md bg-muted/20 font-medium text-sm">
                                        {((watchedLines[index]?.quantity || 0) * (watchedLines[index]?.unitPrice || 0) - (watchedLines[index]?.discountAmount || 0)).toFixed(2)}
                                    </div>
                                </div>
                            </div>
                         </div>
                       );
                     })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar / Summary */}
            <div className="space-y-4">
               <Card>
                 <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
                 <CardContent className="space-y-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Gross Total</span>
                        <span>{grossTotal.toFixed(2)}</span>
                    </div>
                    
                    <div className="space-y-2 pt-2 border-t">
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Line Discounts</span>
                            <span className="text-red-600">-{lineDiscounts.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span>Overall Discount</span>
                            <div className="w-20">
                                <Input 
                                    type="number" 
                                    className="h-7 text-right" 
                                    value={overallDiscount} 
                                    onChange={(e) => setOverallDiscount(parseFloat(e.target.value) || 0)} 
                                />
                            </div>
                        </div>
                        <div className="flex justify-between text-sm font-medium pt-1">
                            <span>Total Discount</span>
                            <span className="text-red-600">-{totalDiscount.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="flex justify-between text-sm pt-2 border-t">
                        <span className="text-muted-foreground">Taxable</span>
                        <span>{taxableAmount.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">VAT (5%)</span>
                        <span>{vatAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold pt-2 border-t">
                        <span>Total (AED)</span>
                        <span>{totalAmount.toFixed(2)}</span>
                    </div>

                    <Button type="submit" className="w-full mt-4 bg-gradient-to-r from-pink-600 to-rose-600" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {initialData ? "Update Order" : "Create Sales Order"}
                    </Button>
                 </CardContent>
               </Card>
            </div>
          </div>
        </form>
      </Form>
    </>
  );
}
