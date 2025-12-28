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
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

// Schema validation
const formSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  purchaseOrderId: z.string().optional(),
  grnDate: z.string().min(1, "Date is required"),
  supplierDocNumber: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(z.object({
    itemId: z.string().min(1, "Item is required"),
    quantity: z.number().min(0.001, "Quantity must be at least 0.001"),
    uom: z.string().min(1, "UOM is required"),
    description: z.string().optional(),
    purchaseOrderId: z.string().optional(), 
  })).min(1, "At least one item is required"),
});

type GRNFormValues = z.infer<typeof formSchema>;

interface GRNFormProps {
  suppliers: any[];
  items: any[];
  initialData?: any; // For edit mode
  openOrders?: any[]; // List of open Purchase Orders to link
}

export function GRNForm({ suppliers, items, initialData, openOrders = [] }: GRNFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [filteredPOs, setFilteredPOs] = useState<any[]>([]);

  const defaultValues: Partial<GRNFormValues> = initialData ? {
    supplierId: initialData.supplierId,
    purchaseOrderId: initialData.purchaseOrderId || "manual",
    grnDate: initialData.grnDate ? new Date(initialData.grnDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    supplierDocNumber: initialData.supplierDocNumber || "",
    notes: initialData.notes || "",
    lines: initialData.lines?.map((l: any) => ({
      itemId: l.itemId,
      quantity: Number(l.quantity),
      uom: l.uom,
      description: l.description || "",
      purchaseOrderId: l.purchaseOrderId
    })) || [{ itemId: "", quantity: 1, uom: "PCS" }],
  } : {
    grnDate: new Date().toISOString().split('T')[0],
    purchaseOrderId: "manual",
    lines: [{ itemId: "", quantity: 1, uom: "PCS" }],
  };

  const form = useForm<GRNFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const { fields, append, remove, replace } = useFieldArray({
    name: "lines",
    control: form.control,
  });

  // Watch supplier to filter POs
  const selectedSupplierId = form.watch("supplierId");
  useEffect(() => {
    if (selectedSupplierId) {
      const supplierPOs = openOrders.filter(po => po.supplierId === selectedSupplierId);
      setFilteredPOs(supplierPOs);
    } else {
      setFilteredPOs([]);
    }
  }, [selectedSupplierId, openOrders]);

  // Handle PO Selection -> Auto-populate lines
  const selectedPOId = form.watch("purchaseOrderId");
  useEffect(() => {
    if (selectedPOId && selectedPOId !== "manual") {
      const po = openOrders.find(o => o.id === selectedPOId);
      if (po && po.lines) {
        // Map PO lines to GRN lines
        const newLines = po.lines.map((line: any) => ({
          itemId: line.itemId,
          quantity: Number(line.quantity) - Number(line.receivedQty || 0), // Remaining qty
          uom: line.uom,
          description: line.description || "",
          purchaseOrderId: po.id
        }));
        
        if (newLines.length > 0) {
           replace(newLines);
           toast.info("Items populated from Purchase Order");
        }
      }
    }
  }, [selectedPOId, openOrders, replace]);

  const onSubmit = async (data: GRNFormValues) => {
    setLoading(true);
    try {
        // TODO: Replace with actual Server Action call
        console.log("Submitting GRN:", data);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        toast.success(initialData ? "GRN updated successfully" : "GRN created successfully");
        router.push("/procurement/grn");
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const TotalQty = form.watch("lines").reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="supplierId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplier *</FormLabel>
                        <Select onValueChange={(val) => {
                            field.onChange(val);
                            form.setValue("purchaseOrderId", "manual"); // Reset PO selection
                        }} defaultValue={field.value} disabled={!!initialData}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select supplier..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {suppliers.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name}
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
                    name="purchaseOrderId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link Purchase Order</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedSupplierId || !!initialData}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Manual Entry (No PO)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="manual">Manual Entry (No PO)</SelectItem>
                            {filteredPOs.map((po) => (
                              <SelectItem key={po.id} value={po.id}>
                                {po.orderNumber} ({new Date(po.orderDate).toLocaleDateString()})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                   <FormField
                    control={form.control}
                    name="grnDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Receipt Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="supplierDocNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplier Ref / DO #</FormLabel>
                        <FormControl>
                          <Input placeholder="Delivery Note No..." {...field} />
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
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">Received Items</h3>
                        <Button type="button" variant="outline" size="sm" onClick={() => append({ itemId: "", quantity: 1, uom: "PCS" })}>
                            <Plus className="mr-2 h-4 w-4" /> Add Item
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="grid gap-4 md:grid-cols-12 items-end border p-4 rounded-md bg-muted/20">
                                <div className="md:col-span-5">
                                    <FormField
                                        control={form.control}
                                        name={`lines.${index}.itemId`}
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className={index !== 0 ? "sr-only" : ""}>Item</FormLabel>
                                            <Select 
                                              onValueChange={field.onChange} 
                                              defaultValue={field.value}
                                              disabled={!!form.getValues(`lines.${index}.purchaseOrderId`)} // Lock item if from PO
                                            >
                                            <FormControl>
                                                <SelectTrigger>
                                                <SelectValue placeholder="Select item..." />
                                                </SelectTrigger>
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
                                <div className="md:col-span-3">
                                     <FormField
                                        control={form.control}
                                        name={`lines.${index}.quantity`}
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className={index !== 0 ? "sr-only" : ""}>Received Qty</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.001" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                     <FormField
                                        control={form.control}
                                        name={`lines.${index}.uom`}
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className={index !== 0 ? "sr-only" : ""}>UOM</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="PCS">PCS</SelectItem>
                                                <SelectItem value="BOX">BOX</SelectItem>
                                                <SelectItem value="KG">KG</SelectItem>
                                            </SelectContent>
                                            </Select>
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
                     {fields.length === 0 && (
                        <div className="text-center py-4 text-muted-foreground text-sm">
                            No items. Select a Purchase Order above to auto-fill, or add items manually.
                        </div>
                    )}
                </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between font-medium">
                            <span>Total Quantity</span>
                            <span>{TotalQty}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                            * Inventory will be increased immediately upon creation.
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                 <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {initialData ? "Update GRN" : "Create GRN"}
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
