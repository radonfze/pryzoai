"use client";

import { useMemo, useEffect, useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Check, 
  ChevronsUpDown, 
  Loader2, 
  Upload, 
  ArrowLeft,
  FileText,
  BadgePercent,
  Receipt,
  Package,
  CheckCircle2,
  TrendingUp,
  Eye,
  Settings,
  MoreVertical
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch"; 
import { Label } from "@/components/ui/label";
import { createPurchaseBillAction } from "@/actions/procurement/create-purchase-bill";

// --- Schema Definitions ---

const billSundrySchema = z.object({
  name: z.string().optional(),
  amount: z.number().default(0),
});

const formSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  supplierEmail: z.string().optional(),
  billDate: z.string().min(1, "Bill Date is required"),
  dueDate: z.string().optional(),
  reference: z.string().optional(),
  
  // New Fields
  warehouseId: z.string().optional(), 
  purchaseType: z.string().default("vat_item_wise"),
  paymentType: z.string().default("credit"),
  status: z.string().default("open"),
  
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),

  lines: z.array(z.object({
    itemId: z.string().min(1, "Item is required"),
    quantity: z.number().min(0.001, "Quantity required"),
    uom: z.string().default("PCS"),
    unitPrice: z.number().min(0, "Price required"),
    discountAmount: z.number().default(0),
    taxAmount: z.number().default(0),
    projectId: z.string().optional(),
    taskId: z.string().optional(),
    description: z.string().optional(),
  })).min(1, "At least one item is required"),

  billSundry: z.array(billSundrySchema).optional(),
});

type PurchaseBillFormValues = z.infer<typeof formSchema>;

interface PurchaseBillFormProps {
  suppliers: any[];
  items: any[];
  warehouses?: any[];
  projects?: any[];
  initialData?: any;
}

export function PurchaseBillForm({ suppliers = [], items = [], warehouses = [], projects = [], initialData }: PurchaseBillFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [openSupplier, setOpenSupplier] = useState(false);
  
  // Design states matched to InvoiceForm
  const [selectedLineIndex, setSelectedLineIndex] = useState<number | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [savedBillNumber, setSavedBillNumber] = useState("");
  
  // Form Initialization
  const form = useForm<PurchaseBillFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      supplierId: initialData.supplierId || "",
      billDate: initialData.invoiceDate ? new Date(initialData.invoiceDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      reference: initialData.supplierInvoiceNo || "",
      notes: initialData.notes || "",
      warehouseId: initialData.warehouseId || "",
      purchaseType: initialData.purchaseType || "vat_item_wise",
      paymentType: initialData.paymentType || "credit",
      status: initialData.status || "open",
      termsAndConditions: initialData.termsAndConditions || "",
      lines: initialData.lines?.map((line: any) => ({
        itemId: line.itemId,
        quantity: Number(line.quantity) || 0,
        uom: line.uom || "PCS",
        unitPrice: Number(line.unitPrice) || 0,
        discountAmount: Number(line.discountAmount) || 0,
        taxAmount: Number(line.taxAmount) || 0,
        projectId: line.projectId || "",
        taskId: line.taskId || "",
        description: line.description || "",
      })) || [{ itemId: "", quantity: 1, uom: "PCS", unitPrice: 0, discountAmount: 0, taxAmount: 0, projectId: "" }],
      billSundry: initialData.billSundry || [{ name: "", amount: 0 }],
    } : {
      billDate: new Date().toISOString().split("T")[0],
      dueDate: new Date().toISOString().split("T")[0],
      reference: "",
      notes: "",
      purchaseType: "vat_item_wise",
      paymentType: "credit",
      status: "open",
      lines: [{ itemId: "", quantity: 1, uom: "PCS", unitPrice: 0, discountAmount: 0, taxAmount: 0, projectId: "" }],
      billSundry: [{ name: "", amount: 0 }],
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    name: "lines",
    control: form.control,
  });

  const { fields: sundryFields, append: appendSundry, remove: removeSundry } = useFieldArray({
    name: "billSundry",
    control: form.control,
  });

  // --- Calculations ---
  const watchedLines = form.watch("lines") || [];
  const watchedSundry = form.watch("billSundry") || [];

  const { subtotal, taxTotal, total } = useMemo(() => {
      let sub = 0;
      let tax = 0;
      
      watchedLines.forEach((line) => {
        const qty = parseFloat(String(line.quantity)) || 0;
        const price = parseFloat(String(line.unitPrice)) || 0;
        const disc = parseFloat(String(line.discountAmount)) || 0;
        const tAmount = parseFloat(String(line.taxAmount)) || 0;
        
        const lineBase = qty * price;
        const taxable = Math.max(0, lineBase - disc);
        
        sub += taxable;
        tax += tAmount;
      });

      let sundryTotal = 0;
      watchedSundry.forEach(s => {
        sundryTotal += parseFloat(String(s.amount)) || 0;
      });

      return {
        subtotal: sub,
        taxTotal: tax,
        total: sub + tax + sundryTotal
      };
  }, [watchedLines, watchedSundry]);

  // --- Handlers ---

  const handleItemSelect = (index: number, itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (item) {
      // Prioritize cost price for purchase, then purchase_price if distinct, fallback to selling price logic (usually standard cost)
      const costPrice = parseFloat(String(item.costPrice)) || 0;
      
      form.setValue(`lines.${index}.unitPrice`, costPrice);
      form.setValue(`lines.${index}.uom`, item.uom || "PCS");
      
      // Auto-calc tax
      const taxRate = item.taxPercent ? parseFloat(String(item.taxPercent)) / 100 : 0.05;
      const isTaxable = item.isTaxable !== false;
      
      if (isTaxable) {
         const qty = form.getValues(`lines.${index}.quantity`) || 0;
         const tax = qty * costPrice * taxRate; // Tax on gross for simplicity per your logic
         form.setValue(`lines.${index}.taxAmount`, parseFloat(tax.toFixed(2)));
      } else {
         form.setValue(`lines.${index}.taxAmount`, 0);
      }
    }
  };

  const updateLineTax = (index: number) => {
      const line = form.getValues(`lines.${index}`);
      const selectedItem = items.find(i => i.id === line.itemId);
      if (selectedItem) {
          const taxMod = selectedItem.taxPercent ? parseFloat(String(selectedItem.taxPercent)) / 100 : 0.05;
          const isTaxable = selectedItem.isTaxable !== false;
          const qty = parseFloat(String(line.quantity)) || 0;
          const price = parseFloat(String(line.unitPrice)) || 0;
          const disc = parseFloat(String(line.discountAmount)) || 0;
           
          const base = (qty * price) - disc;
           
          if (isTaxable && base > 0) {
              const newTax = base * taxMod;
              form.setValue(`lines.${index}.taxAmount`, parseFloat(newTax.toFixed(2)));
          }
      }
  };

  async function onSubmit(data: PurchaseBillFormValues) {
    setLoading(true);
    try {
      const result = await createPurchaseBillAction(data as any);
      if (result.success) {
        setSavedBillNumber(result.data?.billNumber || "Saved");
        setShowSuccessDialog(true);
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  const onInvalid = (errors: any) => {
    console.error("Validation Errors:", errors);
    toast.error("Please check the form for errors.");
  };

  const isDirty = form.formState.isDirty;

  return (
    <>
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <DialogTitle className="text-xl">Bill Created Successfully!</DialogTitle>
            <DialogDescription className="text-base">
              Purchase Bill <span className="font-semibold text-foreground">{savedBillNumber}</span> has been created.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 p-4 dark:from-green-900/20 dark:to-emerald-900/20">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Amount</span>
              <span className="text-lg font-bold text-green-600">{total.toFixed(2)} AED</span>
            </div>
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => {
                setShowSuccessDialog(false);
                form.reset();
                router.refresh();
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Bill
            </Button>
            <Button 
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600"
              onClick={() => {
                setShowSuccessDialog(false);
                router.push("/procurement/bills");
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              View All Bills
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
          
          {/* --- Header --- */}
          <div className="rounded-xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 p-6 text-white shadow-lg">
             <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
               <div className="flex items-center gap-4">
                 <Button type="button" variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => router.back()}>
                   <ArrowLeft className="h-5 w-5" />
                 </Button>
                 <div>
                   <div className="flex items-center gap-3">
                     <FileText className="h-6 w-6" />
                     <h1 className="text-2xl font-bold">{initialData ? "Edit Purchase Bill" : "New Purchase Bill"}</h1>
                   </div>
                   <p className="text-sm text-white/80 mt-1">Manage vendor invoices and inventory ingestion</p>
                 </div>
               </div>
               <div className="flex items-center gap-3">
                 {isDirty && (
                    <Badge variant="secondary" className="bg-amber-500/20 text-amber-100 animate-pulse border-none">
                      <span className="mr-1 h-2 w-2 rounded-full bg-amber-300" />
                      Unsaved changes
                    </Badge>
                  )}
                 <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5">
                    <span className="text-xs font-medium opacity-80">Status:</span>
                    <Badge variant={form.getValues("status") === 'posted' ? "default" : "secondary"} className="capitalize">
                      {form.getValues("status")}
                    </Badge>
                 </div>
               </div>
             </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            {/* --- Main Left Column --- */}
            <div className="space-y-4">
              
              {/* Compact Meta Card */}
              <Card className="shadow-sm">
                <CardContent className="pt-4 pb-3">
                   {/* Row 1: Supplier, Dates, Reference */}
                   <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      {/* Supplier */}
                      <FormField
                        control={form.control}
                        name="supplierId"
                        render={({ field }) => (
                          <FormItem className="md:col-span-1">
                            <FormLabel className="text-xs text-muted-foreground uppercase">Supplier *</FormLabel>
                            <Popover open={openSupplier} onOpenChange={setOpenSupplier}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button variant="outline" role="combobox" className={cn("h-9 w-full justify-between", !field.value && "text-muted-foreground")}>
                                    <span className="truncate">{field.value ? suppliers.find((s) => s.id === field.value)?.name : "Select..."}</span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="p-0">
                                <Command>
                                  <CommandInput placeholder="Search..." />
                                  <CommandList>
                                    <CommandEmpty>No supplier.</CommandEmpty>
                                    <CommandGroup>
                                      {suppliers.map((s) => (
                                        <CommandItem key={s.id} value={s.name} onSelect={() => { form.setValue("supplierId", s.id); setOpenSupplier(false); }}>
                                          <Check className={cn("mr-2 h-4 w-4", s.id === field.value ? "opacity-100" : "opacity-0")} />
                                          {s.name}
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

                      {/* Bill Date */}
                      <FormField
                        control={form.control}
                        name="billDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-muted-foreground uppercase">Bill Date *</FormLabel>
                            <FormControl><Input type="date" className="h-9" {...field} /></FormControl>
                          </FormItem>
                        )}
                      />

                      {/* Due Date */}
                      <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                          <FormItem>
                             <FormLabel className="text-xs text-muted-foreground uppercase">Due Date</FormLabel>
                             <FormControl><Input type="date" className="h-9" {...field} /></FormControl>
                          </FormItem>
                        )}
                      />
                      
                      {/* Reference */}
                      <FormField
                        control={form.control}
                        name="reference"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-muted-foreground uppercase">Ref / Invoice #</FormLabel>
                            <FormControl><Input placeholder="SUP-INV-001" className="h-9" {...field} /></FormControl>
                          </FormItem>
                        )}
                      />
                   </div>

                   {/* Row 2: Warehouse, Types */}
                   <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3 pt-3 border-t">
                      <FormField
                        control={form.control}
                        name="warehouseId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-muted-foreground uppercase">Receiving Warehouse</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || undefined}>
                               <FormControl><SelectTrigger className="h-9"><SelectValue placeholder="Select Warehouse" /></SelectTrigger></FormControl>
                               <SelectContent>
                                  {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                               </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      
                       <FormField
                        control={form.control}
                        name="purchaseType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-muted-foreground uppercase">Purchase Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                               <FormControl><SelectTrigger className="h-9"><SelectValue /></SelectTrigger></FormControl>
                               <SelectContent>
                                  <SelectItem value="vat_item_wise">VAT Item Wise</SelectItem>
                                  <SelectItem value="exempt">Exempt</SelectItem>
                                  <SelectItem value="import">Import</SelectItem>
                               </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="paymentType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-muted-foreground uppercase">Payment Mode</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                               <FormControl><SelectTrigger className="h-9"><SelectValue /></SelectTrigger></FormControl>
                               <SelectContent>
                                  <SelectItem value="credit">Credit</SelectItem>
                                  <SelectItem value="cash">Cash</SelectItem>
                                  <SelectItem value="bank">Bank Transfer</SelectItem>
                               </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />

                      <div className="flex items-end pb-1">
                          <Button 
                             type="button" 
                             variant="outline" 
                             className="w-full h-9 border-dashed text-muted-foreground hover:text-primary"
                          >
                             <Upload className="mr-2 h-4 w-4" /> Upload Scan
                          </Button>
                      </div>
                   </div>
                </CardContent>
              </Card>

              {/* Line Items - Premium Style */}
              <Card className="shadow-md">
                 <CardHeader className="pb-3 border-b bg-muted/5">
                    <div className="flex items-center justify-between">
                       <CardTitle className="flex items-center gap-2 text-base">
                          <Package className="h-5 w-5 text-indigo-500" />
                          Line Items
                          <Badge variant="secondary" className="ml-2 text-xs font-normal text-muted-foreground">
                             {fields.length} item{fields.length !== 1 ? 's' : ''}
                          </Badge>
                       </CardTitle>
                       <Button 
                         type="button" 
                         size="sm" 
                         className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white"
                         onClick={() => append({ itemId: "", quantity: 1, uom: "PCS", unitPrice: 0, discountAmount: 0, taxAmount: 0, projectId: "" })}
                       >
                         <Plus className="h-4 w-4 mr-1" /> Add Item
                       </Button>
                    </div>
                 </CardHeader>
                 <CardContent className="pt-4 space-y-4">
                    {fields.map((field, index) => (
                       <div 
                         key={field.id}
                         className={cn(
                           "rounded-lg border p-3 transition-all",
                           selectedLineIndex === index ? "border-indigo-500 bg-indigo-50/10 shadow-sm" : "border-border/50 hover:border-indigo-200"
                         )}
                         onClick={() => setSelectedLineIndex(index)}
                       >
                         {/* Row Header */}
                         <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline" className="text-[10px] h-5 w-6 flex items-center justify-center p-0">
                               #{index + 1}
                            </Badge>
                            
                            <FormField
                               control={form.control}
                               name={`lines.${index}.itemId`}
                               render={({ field }) => {
                                 const selectedItem = items.find(i => i.id === field.value);
                                 const [open, setOpen] = useState(false);
                                 return (
                                   <FormItem className="flex-1">
                                      <Popover open={open} onOpenChange={setOpen}>
                                         <PopoverTrigger asChild>
                                            <FormControl>
                                               <Button variant="outline" role="combobox" aria-expanded={open} className={cn("h-8 w-full justify-between text-xs", !field.value && "text-muted-foreground")}> 
                                                  <span className="truncate font-medium">{selectedItem ? selectedItem.name : "Select Item..."}</span>
                                                  <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
                                               </Button>
                                            </FormControl>
                                         </PopoverTrigger>
                                         <PopoverContent className="p-0 w-[400px]" align="start">
                                            <Command>
                                               <CommandInput placeholder="Search item..." />
                                               <CommandList>
                                                  <CommandEmpty>No item found.</CommandEmpty>
                                                  <CommandGroup>
                                                     {items.map(item => (
                                                        <CommandItem key={item.id} value={item.name} onSelect={() => {
                                                           field.onChange(item.id);
                                                           handleItemSelect(index, item.id);
                                                           setOpen(false);
                                                        }}>
                                                           {item.name} <span className="ml-2 text-xs text-muted-foreground line-through opacity-70"></span>
                                                        </CommandItem>
                                                     ))}
                                                  </CommandGroup>
                                               </CommandList>
                                            </Command>
                                         </PopoverContent>
                                      </Popover>
                                   </FormItem>
                                 )
                               }}
                            />
                            
                             <FormField
                              control={form.control}
                              name={`lines.${index}.projectId`}
                              render={({ field }) => (
                                <FormItem className="w-[120px]">
                                   <Select onValueChange={(val) => field.onChange(val === "_none" ? "" : val)} value={field.value || undefined}>
                                      <FormControl><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Project" /></SelectTrigger></FormControl>
                                      <SelectContent>
                                         <SelectItem value="_none">None</SelectItem>
                                         {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.projectCode}</SelectItem>)}
                                      </SelectContent>
                                   </Select>
                                </FormItem>
                              )}
                            />

                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => remove(index)}>
                               <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                         </div>

                         {/* Row Values */}
                         <div className="grid grid-cols-6 gap-2">
                             <FormField
                               control={form.control}
                               name={`lines.${index}.uom`}
                               render={({ field }) => (
                                 <FormItem>
                                    <FormLabel className="text-[10px] text-muted-foreground uppercase">Unit</FormLabel>
                                    <FormControl><Input className="h-7 text-xs" {...field} /></FormControl>
                                 </FormItem>
                               )}
                             />
                             <FormField
                               control={form.control}
                               name={`lines.${index}.quantity`}
                               render={({ field }) => (
                                 <FormItem>
                                    <FormLabel className="text-[10px] text-muted-foreground uppercase">Qty</FormLabel>
                                    <FormControl>
                                       <Input 
                                          type="number" className="h-7 text-xs text-center font-medium" 
                                          {...field} 
                                          onChange={e => { field.onChange(parseFloat(e.target.value)||0); updateLineTax(index); }} 
                                       />
                                    </FormControl>
                                 </FormItem>
                               )}
                             />
                             <FormField
                               control={form.control}
                               name={`lines.${index}.unitPrice`}
                               render={({ field }) => (
                                 <FormItem>
                                    <FormLabel className="text-[10px] text-muted-foreground uppercase">Rate</FormLabel>
                                    <FormControl>
                                       <Input 
                                          type="number" className="h-7 text-xs text-right" 
                                          {...field} 
                                          onChange={e => { field.onChange(parseFloat(e.target.value)||0); updateLineTax(index); }} 
                                       />
                                    </FormControl>
                                 </FormItem>
                               )}
                             />
                             <FormField
                               control={form.control}
                               name={`lines.${index}.discountAmount`}
                               render={({ field }) => (
                                 <FormItem>
                                    <FormLabel className="text-[10px] text-muted-foreground uppercase">Disc</FormLabel>
                                    <FormControl>
                                       <Input 
                                          type="number" className="h-7 text-xs text-right" 
                                          {...field} 
                                          onChange={e => { field.onChange(parseFloat(e.target.value)||0); updateLineTax(index); }} 
                                       />
                                    </FormControl>
                                 </FormItem>
                               )}
                             />
                             <FormField
                               control={form.control}
                               name={`lines.${index}.taxAmount`}
                               render={({ field }) => (
                                 <FormItem>
                                    <FormLabel className="text-[10px] text-muted-foreground uppercase">Tax</FormLabel>
                                    <FormControl>
                                       <Input className="h-7 text-xs text-right bg-muted/10 border-dashed" readOnly {...field} />
                                    </FormControl>
                                 </FormItem>
                               )}
                             />
                             
                             <div className="flex flex-col gap-2">
                                <Label className="text-[10px] text-muted-foreground uppercase text-right">Total</Label>
                                <div className="h-7 flex items-center justify-end px-2 rounded-md bg-indigo-50 dark:bg-indigo-900/20 text-xs font-bold text-indigo-700">
                                   {(() => {
                                      const l = form.getValues(`lines.${index}`);
                                      const tot = ((Number(l.quantity)||0) * (Number(l.unitPrice)||0)) - (Number(l.discountAmount)||0) + (Number(l.taxAmount)||0);
                                      return tot.toFixed(2);
                                   })()}
                                </div>
                             </div>
                         </div>
                       </div>
                    ))}

                    {fields.length === 0 && (
                       <div className="text-center py-10 border-2 border-dashed rounded-xl opacity-60">
                          <Package className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm">No items added yet</p>
                          <Button 
                             type="button" 
                             variant="link" 
                             onClick={() => append({ itemId: "", quantity: 1, uom: "PCS", unitPrice: 0, discountAmount: 0, taxAmount: 0, projectId: "" })}
                          >
                             Add your first item
                          </Button>
                       </div>
                    )}
                 </CardContent>
              </Card>

              {/* Remarks Box */}
               <Card>
                  <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                             <FormLabel className="text-xs">Internal Notes</FormLabel>
                             <FormControl><Textarea className="resize-none h-20 text-xs" placeholder="Type..." {...field} /></FormControl>
                          </FormItem>
                        )}
                     />
                     <FormField
                        control={form.control}
                        name="termsAndConditions"
                        render={({ field }) => (
                          <FormItem>
                             <FormLabel className="text-xs">Terms</FormLabel>
                             <FormControl><Textarea className="resize-none h-20 text-xs" placeholder="Review terms..." {...field} /></FormControl>
                          </FormItem>
                        )}
                     />
                  </CardContent>
               </Card>
            </div>

            {/* --- Sidebar (Summary) --- */}
            <div className="lg:sticky lg:top-4 lg:self-start space-y-4">
               {/* Summary Card */}
               <Card className="shadow-md border-t-4 border-t-indigo-500">
                  <CardHeader className="bg-muted/10 pb-3 border-b">
                     <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Receipt className="h-4 w-4" /> Bill Summary
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                     <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{subtotal.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tax (VAT)</span>
                        <span>{taxTotal.toFixed(2)}</span>
                     </div>
                     
                     {/* Bill Sundry Section in Sidebar */}
                     <div className="pt-2 border-t mt-2">
                        <div className="flex items-center justify-between mb-2">
                           <span className="text-xs font-semibold uppercase text-muted-foreground">Charges (Sundry)</span>
                           <Button type="button" variant="ghost" size="icon" className="h-5 w-5" onClick={() => appendSundry({ name: "", amount: 0 })}>
                              <Plus className="h-3 w-3" />
                           </Button>
                        </div>
                        <div className="space-y-2">
                           {sundryFields.map((field, index) => (
                              <div key={field.id} className="flex gap-1 items-center">
                                 <FormField control={form.control} name={`billSundry.${index}.name`} render={({ field }) => (
                                    <Input className="h-6 text-[10px] w-full" placeholder="Name" {...field} />
                                 )} />
                                 <FormField control={form.control} name={`billSundry.${index}.amount`} render={({ field }) => (
                                    <Input type="number" className="h-6 text-[10px] w-16 text-right" placeholder="0" {...field} />
                                 )} />
                                 <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeSundry(index)}>
                                    <Trash2 className="h-3 w-3" />
                                 </Button>
                              </div>
                           ))}
                        </div>
                     </div>

                     <div className="border-t pt-3 mt-2">
                        <div className="flex justify-between items-center">
                           <span className="text-base font-bold">Total</span>
                           <span className="text-xl font-bold text-indigo-600">{total.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-right text-muted-foreground font-medium mt-1">AED</p>
                     </div>
                  </CardContent>
               </Card>

               <Card className="shadow-sm">
                  <CardContent className="pt-4 space-y-2">
                     <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" size="lg" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                        {initialData ? "Update Bill" : "Save Bill"}
                     </Button>
                     <Button type="button" variant="outline" className="w-full" onClick={() => router.push("/procurement/bills")}>Cancel</Button>
                  </CardContent>
               </Card>
            </div>
          </div>
        </form>
      </Form>
    </>
  );
}
