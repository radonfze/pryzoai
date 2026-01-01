"use client";

import { useState, useEffect } from "react";
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
import { Loader2, Save, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { createItemAction, updateItemAction, ItemInput } from "@/actions/inventory/item-actions";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

// Helper function to convert text to Title Case
function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

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
  initialCode?: string; // Auto-generated code from server
  categories: any[];
  subCategories: any[];
  brands: any[];
  models: any[];
  uoms: any[];
  brandMappings?: any[]; // SubCategory Mappings
  brandCategoryMappings?: any[]; // New Category Mappings
}

export default function ItemForm({ initialData, initialCode, categories, subCategories, brands, models, uoms, brandMappings, brandCategoryMappings }: ItemFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEditing = !!initialData;

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
      code: initialCode || "",
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
  const filteredBrands = brands.filter(b => {
      // 1. If SubCategory Selected, check SubCategory Mapping
      if (selectedSubCategoryId && brandMappings && brandMappings.length > 0) {
          // If mapping exists for this subcat, enforce it.
          const hasSubCatMapping = brandMappings.some(bm => bm.subcategoryId === selectedSubCategoryId);
          if (hasSubCatMapping) {
              return brandMappings.some(bm => bm.brandId === b.id && bm.subcategoryId === selectedSubCategoryId);
          }
      }

      // 2. If Category Selected (and passed above check or skipped), check Category Mapping
      if (selectedCategoryId && brandCategoryMappings && brandCategoryMappings.length > 0) {
          const hasCatMappings = brandCategoryMappings.some(m => m.categoryId === selectedCategoryId);
          // If there are ANY brands linked to this category, restrict to those brands.
          // If NO brands linked to this category, maybe show all? Or show none?
          // Default to: Show only linked brands if potential links exist.
          if (hasCatMappings) {
             return brandCategoryMappings.some(bm => bm.brandId === b.id && bm.categoryId === selectedCategoryId);
          }
      }

      return true;
  });

  // Watch all fields needed for auto-name generation
  const watchedDescription = form.watch("description");
  const selectedModelId = form.watch("modelId");

  // Auto-generate item name from Category + SubCategory + Brand + Model + Description
  useEffect(() => {
    if (isEditing) return; // Don't auto-generate for edit mode
    
    const cat = categories.find(c => c.id === selectedCategoryId);
    const sub = subCategories.find(s => s.id === selectedSubCategoryId);
    const brand = brands.find(b => b.id === selectedBrandId);
    const model = models.find(m => m.id === selectedModelId);
    const desc = watchedDescription;

    // Build name parts with proper casing
    const nameParts: string[] = [];
    if (cat?.name) nameParts.push(toTitleCase(cat.name));
    if (sub?.name) nameParts.push(toTitleCase(sub.name));
    if (brand?.name) nameParts.push(toTitleCase(brand.name));
    if (model?.name) nameParts.push(model.name.toUpperCase()); // Model in UPPERCASE
    if (desc?.trim()) nameParts.push(toTitleCase(desc.trim())); // Description in Title Case

    if (nameParts.length > 0) {
      const generatedName = nameParts.join(' ');
      form.setValue("name", generatedName);
    }
  }, [selectedCategoryId, selectedSubCategoryId, selectedBrandId, selectedModelId, watchedDescription, categories, subCategories, brands, models, form, isEditing]);

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
                                <FormControl>
                                  <Input 
                                    placeholder="Auto-generated" 
                                    {...field} 
                                    readOnly 
                                    className="bg-muted font-mono"
                                  />
                                </FormControl>
                                <div className="flex items-center justify-center w-10 h-10 rounded-md bg-muted">
                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>
                            <FormDescription>Auto-generated, read-only</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )} />
                     <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name (En) *</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    readOnly={!isEditing}
                                    className={!isEditing ? "bg-muted" : ""}
                                    placeholder="Auto-generated from selections"
                                  />
                                </FormControl>
                                {!isEditing && <FormDescription>Auto-composed from Category + SubCategory + Brand + Model + Description</FormDescription>}
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
                        <FormField control={form.control} name="categoryId" render={({ field }) => (
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
                     {/* Active Field moved below */}

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
