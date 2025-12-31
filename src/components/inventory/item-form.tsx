"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createItemAction, updateItemAction, ItemInput } from "@/actions/inventory/item-actions";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  nameAr: z.string().optional(),
  nameAr: z.string().optional(),
  categoryId: z.string().optional(),
  subCategoryId: z.string().optional(),
  brandId: z.string().optional(),
  uom: z.string().min(1, "UOM is required"),
  itemType: z.enum(["goods", "service"]),
  
  costPrice: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
  minSellingPrice: z.coerce.number().min(0),
  taxPercent: z.coerce.number().min(0),
  
  reorderLevel: z.coerce.number().min(0),
  reorderQty: z.coerce.number().min(0),
  
  isActive: z.boolean().default(true),
  hasBatchNo: z.boolean().default(false),
  hasSerialNo: z.boolean().default(false),
  hasExpiry: z.boolean().default(false),
  
  barcode: z.string().optional(),
  description: z.string().optional(),
});

interface ItemFormProps {
  initialData?: any;
  categories: any[];
  subCategories: any[];
  brands: any[];
  models: any[];
  uoms: any[];
  brandMappings?: any[];
}

export default function ItemForm({ initialData, categories, subCategories, brands, models, uoms, brandMappings }: ItemFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
        ...initialData,
        costPrice: Number(initialData.costPrice),
        sellingPrice: Number(initialData.sellingPrice),
        minSellingPrice: Number(initialData.minSellingPrice),
        taxPercent: Number(initialData.taxPercent),
        reorderLevel: Number(initialData.reorderLevel),
        reorderQty: Number(initialData.reorderQty),
    } : {
      code: "",
      name: "",
      nameAr: "",
      uom: "PCS",
      itemType: "goods",
      costPrice: 0,
      sellingPrice: 0,
      minSellingPrice: 0,
      taxPercent: 5,
      reorderLevel: 0,
      reorderQty: 0,
      isActive: true,
      hasBatchNo: false,
      hasSerialNo: false,
      hasExpiry: false,
      barcode: "",
      description: ""
    },
  });

  const selectedBrandId = form.watch("brandId");
  const filteredModels = models.filter(m => m.brandId === selectedBrandId);

  const selectedCategoryId = form.watch("categoryId");
  const filteredSubCategories = subCategories.filter(sc => sc.categoryId === selectedCategoryId);

  const selectedSubCategoryId = form.watch("subCategoryId");
  
  // Dependency: Filter Brands by Category/SubCategory
  const filteredBrands = selectedSubCategoryId && brandMappings
    ? brands.filter(b => brandMappings.some(bm => bm.brandId === b.id && bm.subcategoryId === selectedSubCategoryId))
    : brands; // If no subcat or mapping, show all (or could filter by category if mapped differently)

  const handleGenerateSku = () => {
      const cat = categories.find(c => c.id === selectedCategoryId);
      const sub = subCategories.find(s => s.id === selectedSubCategoryId);
      const brand = brands.find(b => b.id === selectedBrandId);
      const model = models.find(m => m.id === form.getValues("modelId")); // Watch logic above might be slow, use getValues
      
      const parts = [];
      if (cat?.code) parts.push(cat.code);
      if (brand?.code) parts.push(brand.code); // Blueprint skips subcat code in formula usually, but we can add
      if (model?.code) parts.push(model.code);
      
      const sequence = Math.floor(Math.random() * 9000) + 1000; // Random 4 digits for uniqueness for now
      parts.push(sequence);
      
      const sku = parts.join("-").toUpperCase();
      form.setValue("code", sku);
      toast.info(`Generated SKU: ${sku}`);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
        let res;
        if (initialData) {
            res = await updateItemAction(initialData.id, values as ItemInput);
        } else {
            res = await createItemAction(values as ItemInput);
        }

        if (res.success) {
            toast.success(res.message);
            router.push("/inventory/items");
            router.refresh();
        } else {
            toast.error(res.message);
        }
    } catch (error) {
        console.error(error);
        toast.error("Something went wrong");
    } finally {
        setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Item
            </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
            {/* General Info */}
            <Card>
                <CardHeader><CardTitle>General Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <FormField control={form.control} name="code" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Item Code *</FormLabel>
                            <div className="flex gap-2">
                                <FormControl><Input placeholder="ITM-001" {...field} /></FormControl>
                                <Button type="button" variant="outline" size="icon" onClick={handleGenerateSku} title="Auto-Generate SKU">
                                    <Wand2 className="h-4 w-4" />
                                </Button>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )} />
                     <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name (En) *</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="nameAr" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name (Ar)</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                            <FormItem>
                                <FormLabel>Category</FormLabel>
                                <Select onValueChange={(val) => {
                                    field.onChange(val);
                                    form.setValue("subCategoryId", ""); // Reset subcat
                                    
                                    // Dependency: Auto-fill UOM
                                    const selectedCat = categories.find(c => c.id === val);
                                    if (selectedCat?.defaultUomId) {
                                        form.setValue("uom", selectedCat.defaultUomId);
                                        toast.info(`UOM auto-filled: ${selectedCat.defaultUomId}`);
                                    }
                                }} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )} />
                        
                        <FormField control={form.control} name="subCategoryId" render={({ field }) => (
                            <FormItem>
                                <FormLabel>SubCategory</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedCategoryId}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select SubCategory" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {filteredSubCategories.map(sc => <SelectItem key={sc.id} value={sc.id}>{sc.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )} />
                    </div>

                     <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="brandId" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Brand</FormLabel>
                                <Select onValueChange={(val) => {
                                    field.onChange(val);
                                    form.setValue("modelId", ""); // Reset model
                                }} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select Brand" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {filteredBrands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )} />
                         {/* Model Selection (Cascading) */}
                         <FormField control={form.control} name="modelId" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Model</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedBrandId}>
                                    <FormControl><SelectTrigger><SelectValue placeholder={selectedBrandId ? "Select Model" : "Select Brand First"} /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {filteredModels.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )} />
                    </div>

                     <FormField control={form.control} name="itemType" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="goods">Goods (Stock)</SelectItem>
                                    <SelectItem value="service">Service (Non-Stock)</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )} />
                </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
                <CardHeader><CardTitle>Pricing & Units</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="uom" render={({ field }) => (
                            <FormItem>
                                <FormLabel>UOM *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select UOM" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {uoms && uoms.map(u => (
                                            <SelectItem key={u.id} value={u.code}>
                                                {u.code} ({u.name})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="taxPercent" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tax Rate (%)</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                            </FormItem>
                        )} />
                    </div>
                    <Separator />
                     <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="costPrice" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Cost Price</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="sellingPrice" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Selling Price</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                            </FormItem>
                        )} />
                    </div>
                    <FormField control={form.control} name="minSellingPrice" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Min. Selling Price</FormLabel>
                            <FormControl><Input type="number" {...field} /></FormControl>
                        </FormItem>
                    )} />
                </CardContent>
            </Card>

            {/* Controls */}
             <Card>
                <CardHeader><CardTitle>Inventory Controls</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <div className="space-y-1 leading-none">
                            <FormLabel>Active Item</FormLabel>
                            <FormDescription>Item can be used in transactions</FormDescription>
                        </div>
                    </div>

                    <FormField control={form.control} name="isActive" render={({ field }) => (
                         <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            <div className="space-y-1 leading-none"><FormLabel>Active</FormLabel></div>
                        </div>
                    )} />
                    <FormField control={form.control} name="hasBatchNo" render={({ field }) => (
                         <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            <div className="space-y-1 leading-none"><FormLabel>Batch Tracking</FormLabel></div>
                        </div>
                    )} />
                    <FormField control={form.control} name="hasSerialNo" render={({ field }) => (
                         <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            <div className="space-y-1 leading-none"><FormLabel>Serial Tracking</FormLabel></div>
                        </div>
                    )} />
                     <FormField control={form.control} name="hasExpiry" render={({ field }) => (
                         <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            <div className="space-y-1 leading-none"><FormLabel>Expiry Tracking</FormLabel></div>
                        </div>
                    )} />
                    
                     <div className="grid grid-cols-2 gap-4 mt-4">
                        <FormField control={form.control} name="reorderLevel" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Reorder Level</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="reorderQty" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Reorder Qty</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                            </FormItem>
                        )} />
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader><CardTitle>Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <FormField control={form.control} name="barcode" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Barcode</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                        </FormItem>
                    )} />
                     <FormField control={form.control} name="description" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl><Textarea {...field} /></FormControl>
                        </FormItem>
                    )} />
                </CardContent>
            </Card>
        </div>
      </form>
    </Form>
  );
}
