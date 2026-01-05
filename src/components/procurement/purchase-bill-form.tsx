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
import { Plus, Trash2, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createPurchaseBillAction } from "@/actions/procurement/create-purchase-bill";

const formSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  billDate: z.string().min(1, "Bill Date is required"),
  dueDate: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(z.object({
    itemId: z.string().min(1, "Item is required"),
    quantity: z.number().min(0.001, "Quantity required"),
    unitPrice: z.number().min(0, "Price required"),
    taxAmount: z.number().optional(),
    description: z.string().optional(),
  })).min(1, "At least one item is required"),
});

type PurchaseBillFormValues = z.infer<typeof formSchema>;

interface PurchaseBillFormProps {
  suppliers: any[];
  items: any[];
}

// Sub-component for Item Combobox to manage state per row
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
              "w-full justify-between h-9 px-3",
              !value && "text-muted-foreground"
            )}
          >
            {value
              ? items.find((item) => item.id === value)?.name || "Select Item"
              : "Select Item"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search item..." />
          <CommandList>
            <CommandEmpty>No item found.</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  value={item.id} // use name for search if needed, but ID for value
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
                    <span>{item.name}</span>
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

export function PurchaseBillForm({ suppliers = [], items = [] }: PurchaseBillFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [openSupplier, setOpenSupplier] = useState(false);
  
  // Calculations
  const [subtotal, setSubtotal] = useState(0);
  const [taxTotal, setTaxTotal] = useState(0);
  const [total, setTotal] = useState(0);

  const form = useForm<PurchaseBillFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      billDate: new Date().toISOString().split("T")[0],
      dueDate: new Date().toISOString().split("T")[0],
      reference: "",
      notes: "",
      lines: [{ itemId: "", quantity: 1, unitPrice: 0, taxAmount: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    name: "lines",
    control: form.control,
  });

  // Calculate totals whenever lines change
  const wLines = form.watch("lines");
  useEffect(() => {
    let sub = 0;
    let tax = 0;

    wLines.forEach((line) => {
      const qty = Number(line.quantity) || 0;
      const price = Number(line.unitPrice) || 0;
      const tAmount = Number(line.taxAmount) || 0;
      
      sub += qty * price;
      tax += tAmount;
    });

    setSubtotal(sub);
    setTaxTotal(tax);
    setTotal(sub + tax);
  }, [wLines]); // Careful with dependency array, deep comparison is expensive but form.watch returns new objects on change

  async function onSubmit(data: PurchaseBillFormValues) {
    setLoading(true);
    try {
      const payload = {
        ...data,
        dueDate: data.dueDate || data.billDate,
      };

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
      form.setValue(`lines.${index}.unitPrice`, Number(item.costPrice || 0));
      const taxRate = item.taxPercent ? Number(item.taxPercent) / 100 : 0.05;
      const isTaxable = item.isTaxable !== false;
      if (isTaxable) {
         const qty = form.getValues(`lines.${index}.quantity`) || 1;
         const tax = qty * Number(item.costPrice || 0) * taxRate;
         form.setValue(`lines.${index}.taxAmount`, Number(tax.toFixed(2)));
      } else {
         form.setValue(`lines.${index}.taxAmount`, 0);
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bill Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="billDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bill Date *</FormLabel>
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

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="supplierId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Supplier *</FormLabel>
                        <Popover open={openSupplier} onOpenChange={setOpenSupplier}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "justify-between",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value
                                  ? suppliers.find((s) => s.id === field.value)?.name
                                  : "Select supplier"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="p-0">
                            <Command>
                              <CommandInput placeholder="Search supplier..." />
                              <CommandList>
                                <CommandEmpty>No supplier found.</CommandEmpty>
                                <CommandGroup>
                                  {suppliers.map((s) => (
                                    <CommandItem
                                      value={s.name} // Search by name
                                      key={s.id}
                                      onSelect={() => {
                                        form.setValue("supplierId", s.id);
                                        setOpenSupplier(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          s.id === field.value
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
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
                    name="reference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplier Ref / Invoice #</FormLabel>
                        <FormControl>
                          <Input placeholder="Invoice No..." {...field} />
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
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Line Items</CardTitle>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => append({ itemId: "", quantity: 1, unitPrice: 0, taxAmount: 0 })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="grid gap-4 md:grid-cols-12 items-end border p-4 rounded-lg">
                       <div className="md:col-span-5">
                          <FormField
                            control={form.control}
                            name={`lines.${index}.itemId`}
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel className="text-xs">Item</FormLabel>
                                <ItemCombobox
                                  value={field.value}
                                  onChange={field.onChange}
                                  items={items}
                                  onSelect={(val) => handleItemSelect(index, val)}
                                />
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
                                <FormLabel className="text-xs">Qty</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    className="h-9"
                                    min={0}
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
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
                                <FormLabel className="text-xs">Cost Price</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    className="h-9"
                                    min={0}
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                       </div>
                       
                        <div className="md:col-span-2">
                          <FormField
                            control={form.control}
                            name={`lines.${index}.taxAmount`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Tax (AED)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    className="h-9"
                                    min={0}
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                       </div>

                       <div className="md:col-span-1 flex justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                       </div>
                    </div>
                  ))}
                  {fields.length === 0 && (
                     <div className="flex flex-col items-center justify-center py-8 text-muted-foreground border-dashed border-2 rounded-lg bg-muted/10">
                       <p>No items added.</p>
                       <Button 
                         type="button" 
                         variant="link" 
                         onClick={() => append({ itemId: "", quantity: 1, unitPrice: 0, taxAmount: 0 })}
                       >
                         Add your first item
                       </Button>
                     </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
             <Card>
              <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-mono">{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">VAT Total</span>
                  <span className="font-mono">{taxTotal.toFixed(2)}</span>
                </div>
                <div className="border-t pt-4 flex justify-between font-bold">
                  <span>Total (AED)</span>
                  <span className="font-mono text-lg">{total.toFixed(2)}</span>
                </div>

                <Button className="w-full mt-6" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Bill
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}
