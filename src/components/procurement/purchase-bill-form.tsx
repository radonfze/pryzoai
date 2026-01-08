"use client";

import { useMemo, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Added Textarea for Remarks
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Check, ChevronsUpDown, Loader2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createPurchaseBillAction } from "@/actions/procurement/create-purchase-bill";

const billSundrySchema = z.object({
  name: z.string().optional(),
  amount: z.number().default(0),
});

const formSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  supplierEmail: z.string().optional(), // Display only mainly
  billDate: z.string().min(1, "Bill Date is required"),
  dueDate: z.string().optional(),
  reference: z.string().optional(),
  
  // New Fields
  warehouseId: z.string().optional(), // Material Center
  purchaseType: z.string().default("vat_item_wise"),
  paymentType: z.string().default("credit"),
  status: z.string().default("open"),
  
  notes: z.string().optional(), // Remarks
  termsAndConditions: z.string().optional(),

  lines: z.array(z.object({
    itemId: z.string().min(1, "Item is required"),
    quantity: z.number().min(0.001, "Quantity required"),
    uom: z.string().min(1, "Unit required"), // Unit
    unitPrice: z.number().min(0, "Price required"), // Rate
    discountAmount: z.number().default(0), // Discount
    taxAmount: z.number().default(0), // TAX
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

// Sub-component for Item Combobox
function ItemCombobox({ 
  value, 
  onChange, 
  items,
  onSelect 
}: { 
  value: string, 
  onChange: (val: string) => void, 
  items: any[], 
  onSelect: (val: string) => void 
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              "w-full justify-between h-9 px-3 font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <span className="truncate">
              {value
                ? items.find((item) => item.id === value)?.name || "Search Item"
                : "Search Item by Code"}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search item code/name..." />
          <CommandList>
            <CommandEmpty>No item found.</CommandEmpty>
            <CommandGroup>
              {items.slice(0, 50).map((item) => (
                <CommandItem
                  value={item.id}
                  key={item.id}
                  onSelect={() => {
                    onChange(item.id);
                    onSelect(item.id);
                    setOpen(false);
                  }}
                  keywords={[item.name, item.code || ""]}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      item.id === value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{item.name}</span>
                    {item.code && <span className="text-xs text-muted-foreground">{item.code}</span>}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function PurchaseBillForm({ suppliers = [], items = [], warehouses = [], projects = [], initialData }: PurchaseBillFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [openSupplier, setOpenSupplier] = useState(false);
  const isEdit = !!initialData;
  
  // Calculations
  const form = useForm<PurchaseBillFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      supplierId: initialData.supplierId || "",
      billDate: initialData.invoiceDate || new Date().toISOString().split("T")[0],
      dueDate: initialData.dueDate || new Date().toISOString().split("T")[0],
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
      })) || [{ itemId: "", quantity: 0, uom: "PCS", unitPrice: 0, discountAmount: 0, taxAmount: 0, projectId: "" }],
      billSundry: initialData.billSundry || [{ name: "", amount: 0 }],
    } : {
      billDate: new Date().toISOString().split("T")[0],
      dueDate: new Date().toISOString().split("T")[0],
      reference: "",
      notes: "",
      purchaseType: "vat_item_wise",
      paymentType: "credit",
      status: "open",
      lines: [{ itemId: "", quantity: 0, uom: "PCS", unitPrice: 0, discountAmount: 0, taxAmount: 0, projectId: "" }],
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

  const watchedLines = form.watch("lines");
  const watchedSundry = form.watch("billSundry");

  const { subtotal, taxTotal, total } = useMemo(() => {
    let sub = 0;
    let tax = 0;
    const lines = watchedLines || [];
    
    lines.forEach((line) => {
      const qty = parseFloat(String(line.quantity)) || 0;
      const price = parseFloat(String(line.unitPrice)) || 0;
      const disc = parseFloat(String(line.discountAmount)) || 0;
      const tAmount = parseFloat(String(line.taxAmount)) || 0;
      
      const lineBase = qty * price;
      const taxable = Math.max(0, lineBase - disc);
      
      sub += taxable;
      tax += tAmount;
    });

    const currentSundry = watchedSundry || [];
    let sundryTotal = 0;
    currentSundry.forEach(s => {
      sundryTotal += parseFloat(String(s.amount)) || 0;
    });

    return {
      subtotal: sub,
      taxTotal: tax,
      total: sub + tax + sundryTotal
    };
  }, [watchedLines, watchedSundry]);
  
  // Helper to re-calculate line tax when qty/price changes
  const updateLineTax = (index: number) => {
     // This would ideally check the Item's tax percent. 
     // Since we don't have easy access to the exact item object here without searching 'items' array again:
     const line = form.getValues(`lines.${index}`);
     // If we want to be safe, we can default to 5% if we know it's taxable.
     // But we don't know if it's taxable without the item.
     // Let's rely on handleItemSelect setting a hidden 'taxRate' field in the future, 
     // but for now, let's try to lookup item again or assume 5% if 'taxAmount' was previously set > 0
     
     // QUICK FIX: If taxAmount was > 0 or it's a new line with a selected item,
     // we could try to re-apply 5% logic.
     // Better yet, let's look up the item:
     const selectedItem = items.find(i => i.id === line.itemId);
     if (selectedItem) {
          const taxMod = selectedItem.taxPercent ? parseFloat(String(selectedItem.taxPercent)) / 100 : 0.05;
          const isTaxable = selectedItem.isTaxable !== false;
          const qty = parseFloat(String(line.quantity)) || 0;
          const price = parseFloat(String(line.unitPrice)) || 0;
           const disc = parseFloat(String(line.discountAmount)) || 0;
           
          // Taxable Amount = (Qty * Price) - Discount
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
      const payload = { ...data };
      const result = await createPurchaseBillAction(payload as any);
      if (result.success) {
        toast.success(result.message);
        router.push("/procurement/bills");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  }

  const handleItemSelect = (index: number, itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (item) {
      const costPrice = parseFloat(String(item.costPrice)) || 0;
      form.setValue(`lines.${index}.unitPrice`, costPrice);
      form.setValue(`lines.${index}.uom`, item.uom || "PCS");
      
      // Auto-calc tax (basic logic)
      const taxRate = item.taxPercent ? parseFloat(String(item.taxPercent)) / 100 : 0.05;
      const isTaxable = item.isTaxable !== false;
      
      if (isTaxable) {
         const qty = form.getValues(`lines.${index}.quantity`) || 0;
         // Tax on (Qty * Price) - Wait, discount? 
         // For complexity, let's just do Tax on Gross for now unless discount is entered.
         const tax = qty * costPrice * taxRate;
         form.setValue(`lines.${index}.taxAmount`, parseFloat(tax.toFixed(2)));
      } else {
         form.setValue(`lines.${index}.taxAmount`, 0);
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Header Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
           {/* Row 1 */}
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice No / Ref *</FormLabel>
                    <FormControl><Input placeholder="Invoice No" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="billDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date *</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="warehouseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material Center</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select Center" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="purchaseType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="vat_item_wise">VAT Item Wise</SelectItem>
                        <SelectItem value="exempt">Exempt</SelectItem>
                        <SelectItem value="import">Import</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
           </div>

           {/* Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="paymentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select Payment" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="credit">Credit</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem className="flex flex-col md:col-span-1">
                    <FormLabel>Supplier Name *</FormLabel>
                    <Popover open={openSupplier} onOpenChange={setOpenSupplier}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn("justify-between px-3 font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? suppliers.find((s) => s.id === field.value)?.name : "Select Supplier"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="p-0">
                        <Command>
                          <CommandInput placeholder="Search supplier..." />
                          <CommandList>
                             <CommandGroup>
                               {suppliers.map((s) => (
                                 <CommandItem
                                   value={s.name}
                                   key={s.id}
                                   onSelect={() => {
                                     form.setValue("supplierId", s.id);
                                     if (s.email) form.setValue("supplierEmail", s.email);
                                     setOpenSupplier(false);
                                   }}
                                 >
                                   <Check className={cn("mr-2 h-4 w-4", s.id === field.value ? "opacity-100" : "opacity-0")} />
                                   {s.name}
                                 </CommandItem>
                               ))}
                             </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="supplierEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl><Input placeholder="Email" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                       <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                       <SelectContent>
                         <SelectItem value="open">Open</SelectItem>
                         <SelectItem value="posted">Posted</SelectItem>
                         <SelectItem value="draft">Draft</SelectItem>
                       </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
           </div>

           {/* Excel Upload Placeholder */}
           <div className="flex items-center gap-4 border p-2 rounded-md bg-muted/20">
              <Button type="button" variant="outline" size="sm">Browse...</Button>
              <span className="text-sm text-muted-foreground">No file selected.</span>
              <Button type="button" size="sm" className="ml-auto bg-blue-500 hover:bg-blue-600">Item Excel Upload</Button>
           </div>
        </div>

        {/* Line Items Table Section */}
        <div className="rounded-md border bg-white">
            <div className="p-4 border-b bg-muted/10 font-medium grid grid-cols-12 gap-2 text-xs uppercase tracking-wider text-muted-foreground text-center">
                 <div className="col-span-1">S/N</div>
                 <div className="col-span-3 text-left pl-2">Item *</div>
                 <div className="col-span-1">Unit</div>
                 <div className="col-span-1">Qty *</div>
                 <div className="col-span-1">Rate *</div>
                 <div className="col-span-1">Disc</div>
                 <div className="col-span-1">Tax</div>
                 <div className="col-span-1">Total</div>
                 <div className="col-span-2">Project</div>
            </div>
            
            <div className="divide-y max-h-[500px] overflow-y-auto">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 p-2 items-center hover:bg-muted/5">
                   <div className="col-span-1 text-center text-xs">{index + 1}</div>
                   
                   <div className="col-span-3">
                      <FormField
                        control={form.control}
                        name={`lines.${index}.itemId`}
                        render={({ field }) => (
                           <ItemCombobox
                             value={field.value}
                             onChange={field.onChange}
                             items={items}
                             onSelect={(val) => handleItemSelect(index, val)}
                           />
                        )}
                      />
                   </div>

                   <div className="col-span-1">
                      <FormField control={form.control} name={`lines.${index}.uom`} render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                           <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                           <SelectContent><SelectItem value="PCS">PCS</SelectItem><SelectItem value="BOX">BOX</SelectItem><SelectItem value="KG">KG</SelectItem></SelectContent>
                        </Select>
                      )} />
                   </div>

                   <div className="col-span-1">
                      <FormField control={form.control} name={`lines.${index}.quantity`} render={({ field }) => (
                        <Input type="number" className="h-8 text-center" min={0} {...field} onChange={e => {
                            field.onChange(parseFloat(e.target.value) || 0);
                            updateLineTax(index);
                        }} />
                      )} />
                   </div>

                   <div className="col-span-1">
                      <FormField control={form.control} name={`lines.${index}.unitPrice`} render={({ field }) => (
                        <Input type="number" className="h-8 text-center" min={0} {...field} onChange={e => {
                            field.onChange(parseFloat(e.target.value) || 0);
                            updateLineTax(index);
                        }} />
                      )} />
                   </div>

                   <div className="col-span-1">
                       <FormField control={form.control} name={`lines.${index}.discountAmount`} render={({ field }) => (
                        <Input type="number" className="h-8 text-center" min={0} {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                      )} />
                   </div>

                   <div className="col-span-1">
                      <FormField control={form.control} name={`lines.${index}.taxAmount`} render={({ field }) => (
                        <Input type="number" className="h-8 text-center bg-muted/10" readOnly {...field} />
                      )} />
                   </div>

                    <div className="col-span-1 text-right text-sm font-medium pr-2">
                       {(() => {
                          const l = form.getValues(`lines.${index}`);
                          const tot = ((Number(l.quantity)||0) * (Number(l.unitPrice)||0)) - (Number(l.discountAmount)||0) + (Number(l.taxAmount)||0);
                          return tot.toFixed(2);
                       })()}
                   </div>
                   
                   <div className="col-span-2 flex gap-1">
                      <FormField control={form.control} name={`lines.${index}.projectId`} render={({ field }) => (
                         <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="h-8 text-xs w-full"><SelectValue placeholder="Project" /></SelectTrigger>
                            <SelectContent>
                              {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.projectCode}</SelectItem>)}
                            </SelectContent>
                         </Select>
                      )} />
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(index)}>
                          <Trash2 className="h-4 w-4" />
                       </Button>
                   </div>
                </div>
              ))}
            </div>
             <div className="p-2 border-t">
               <Button type="button" variant="outline" size="sm" onClick={() => append({ itemId: "", quantity: 0, uom: "PCS", unitPrice: 0, discountAmount: 0, taxAmount: 0, projectId: "" })}>
                 <Plus className="mr-2 h-4 w-4" /> Add Line
               </Button>
             </div>
        </div>

        {/* Footer: Remarks & Bill Sundry */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-4">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Remarks" className="min-h-[100px]" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="termsAndConditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Terms And Conditions</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Terms..." className="min-h-[80px]" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
           </div>

           <div className="space-y-4">
              <Card>
                 <CardHeader className="py-2 px-4 bg-muted/20 border-b"><CardTitle className="text-sm">Bill Sundry</CardTitle></CardHeader>
                 <CardContent className="p-0">
                    <div className="rounded-b-md">
                       <div className="grid grid-cols-12 gap-2 p-2 bg-muted/10 text-xs font-medium">
                          <div className="col-span-1">S/N</div>
                          <div className="col-span-5">Bill Sundry</div>
                          <div className="col-span-4">Amount</div>
                          <div className="col-span-2">Action</div>
                       </div>
                       {sundryFields.map((field, index) => (
                         <div key={field.id} className="grid grid-cols-12 gap-2 p-2 items-center">
                            <div className="col-span-1 text-center text-xs">{index + 1}</div>
                            <div className="col-span-5">
                               <FormField control={form.control} name={`billSundry.${index}.name`} render={({ field }) => (
                                 <Input className="h-7 text-xs" placeholder="Charge Name" {...field} />
                               )} />
                            </div>
                            <div className="col-span-4">
                               <FormField control={form.control} name={`billSundry.${index}.amount`} render={({ field }) => (
                                 <Input type="number" className="h-7 text-xs text-right" {...field} onChange={e => field.onChange(parseFloat(e.target.value)||0)} />
                               )} />
                            </div>
                            <div className="col-span-2">
                               <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeSundry(index)}>
                                  <Trash2 className="h-3 w-3" />
                               </Button>
                            </div>
                         </div>
                       ))}
                       <div className="p-2 border-t">
                          <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={() => appendSundry({ name: "", amount: 0 })}>
                            + Add Charge
                          </Button>
                       </div>
                    </div>
                 </CardContent>
              </Card>

              <div className="flex justify-between items-center pt-4 border-t">
                 <span className="font-bold text-lg">Grand Total :</span>
                 <span className="font-bold text-xl">{total.toFixed(2)}</span>
              </div>
           </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.push("/procurement/bills")}>Cancel</Button>
          <Button type="submit" disabled={loading} className="w-[150px]">
             {loading ? <Loader2 className="animate-spin mr-2" /> : null} Save
          </Button>
        </div>
      </form>
    </Form>
  );
}
