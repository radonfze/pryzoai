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
  modelId: z.string().optional(),
  partNumber: z.string().optional(),
  uom: z.string().min(1, "UOM is required"),
  alternativeUom: z.string().optional(), // New field
  conversionFactor: z.coerce.number().optional(), // New field
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
  isDuplicate?: boolean; // When duplicating an item
}

export default function ItemForm({ initialData, initialCode, categories, subCategories, brands, models, uoms, brandMappings, brandCategoryMappings, isDuplicate }: ItemFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEditing = !!initialData?.id && !isDuplicate; // Only editing if has ID and not duplicating


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
      description: "",
      partNumber: "",
      alternativeUom: "",
      conversionFactor: undefined,
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
    const partNum = form.watch("partNumber");
    const desc = watchedDescription;

    // Build name parts - ALL UPPERCASE
    const nameParts: string[] = [];
    if (cat?.name) nameParts.push(cat.name.toUpperCase());
    if (sub?.name) nameParts.push(sub.name.toUpperCase());
    if (brand?.name) nameParts.push(brand.name.toUpperCase());
    if (model?.name) nameParts.push(model.name.toUpperCase());
    if (partNum?.trim()) nameParts.push(partNum.trim().toUpperCase());
    if (desc?.trim()) nameParts.push(desc.trim().toUpperCase());

    if (nameParts.length > 0) {
      const generatedName = nameParts.join(' ');
      form.setValue("name", generatedName);
    }
  }, [selectedCategoryId, selectedSubCategoryId, selectedBrandId, selectedModelId, watchedDescription, form.watch("partNumber"), categories, subCategories, brands, models, form, isEditing]);

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

        <div className="grid gap-4 md:grid-cols-3">
            {/* Column 1: General Info */}
            <Card className="h-full">
                <CardHeader className="py-3 px-4 bg-muted/20 border-b"><CardTitle className="text-base">General Info</CardTitle></CardHeader>
                <CardContent className="p-4 space-y-3">
                    <FormField control={form.control} name="code" render={({ field }) => (
                        <FormItem className="space-y-1">
                            <FormLabel className="text-xs">Item Code *</FormLabel>
                            <div className="flex gap-2">
                                <FormControl>
                                  <Input placeholder="Auto" {...field} readOnly className="h-8 bg-muted font-mono text-xs" />
                                </FormControl>
                                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted">
                                    <Lock className="h-3 w-3 text-muted-foreground" />
                                </div>
                            </div>
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem className="space-y-1">
                            <FormLabel className="text-xs">Name (En) *</FormLabel>
                            <FormControl><Input {...field} readOnly={!isEditing} className={`h-8 ${!isEditing ? "bg-muted" : ""} text-xs`} placeholder="Auto-generated" /></FormControl>
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="nameAr" render={({ field }) => (
                        <FormItem className="space-y-1">
                            <FormLabel className="text-xs">Name (Ar)</FormLabel>
                            <FormControl><Input {...field} className="h-8 text-xs" /></FormControl>
                        </FormItem>
                    )} />
                    
                    <div className="grid grid-cols-2 gap-2">
                         <FormField control={form.control} name="categoryId" render={({ field }) => (
                            <FormItem className="space-y-1">
                                <FormLabel className="text-xs">Category</FormLabel>
                                <Select onValueChange={(val) => {
                                    field.onChange(val);
                                    form.setValue("subCategoryId", "");
                                    const selectedCat = categories.find(c => c.id === val);
                                    if (selectedCat) {
                                      if (selectedCat.baseUomId) {
                                        const baseUom = uoms.find(u => u.id === selectedCat.baseUomId);
                                        if (baseUom) form.setValue("uom", baseUom.code);
                                      }
                                      if (selectedCat.alternativeUomId) {
                                        const altUom = uoms.find(u => u.id === selectedCat.alternativeUomId);
                                        if (altUom) {
                                            form.setValue("alternativeUom", altUom.code);
                                            if (selectedCat.conversionFactor) form.setValue("conversionFactor", Number(selectedCat.conversionFactor));
                                        }
                                      }
                                    }
                                }} defaultValue={field.value}>
                                    <FormControl><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {categories.map(c => <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )} />
                        
                        <FormField control={form.control} name="subCategoryId" render={({ field }) => (
                            <FormItem className="space-y-1">
                                <FormLabel className="text-xs">SubCategory</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedCategoryId}>
                                    <FormControl><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {filteredSubCategories.map(sc => <SelectItem key={sc.id} value={sc.id} className="text-xs">{sc.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )} />
                    </div>

                     <div className="grid grid-cols-2 gap-2">
                        <FormField control={form.control} name="brandId" render={({ field }) => (
                            <FormItem className="space-y-1">
                                <FormLabel className="text-xs">Brand</FormLabel>
                                <Select onValueChange={(val) => {
                                    field.onChange(val);
                                    form.setValue("modelId", "");
                                }} defaultValue={field.value}>
                                    <FormControl><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {filteredBrands.map(b => <SelectItem key={b.id} value={b.id} className="text-xs">{b.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )} />
                         <FormField control={form.control} name="modelId" render={({ field }) => (
                            <FormItem className="space-y-1">
                                <FormLabel className="text-xs">Model</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedBrandId}>
                                    <FormControl><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {filteredModels.map(m => <SelectItem key={m.id} value={m.id} className="text-xs">{m.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )} />
                    </div>

                     <FormField control={form.control} name="partNumber" render={({ field }) => (
                        <FormItem className="space-y-1">
                            <FormLabel className="text-xs">Part Number</FormLabel>
                            <FormControl><Input placeholder="e.g. SKU-123" {...field} className="h-8 text-xs" /></FormControl>
                        </FormItem>
                    )} />

                     <FormField control={form.control} name="itemType" render={({ field }) => (
                        <FormItem className="space-y-1">
                            <FormLabel className="text-xs">Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="goods" className="text-xs">Goods (Stock)</SelectItem>
                                    <SelectItem value="service" className="text-xs">Service (Non-Stock)</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )} />
                </CardContent>
            </Card>

            {/* Column 2: Pricing & Units */}
            <Card className="h-full">
                <CardHeader className="py-3 px-4 bg-muted/20 border-b"><CardTitle className="text-base">Pricing & Units</CardTitle></CardHeader>
                <CardContent className="p-4 space-y-3">
                     <div className="grid grid-cols-2 gap-2">
                        <FormField control={form.control} name="uom" render={({ field }) => (
                            <FormItem className="space-y-1">
                                <FormLabel className="text-xs">UOM *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {uoms && uoms.map(u => (
                                            <SelectItem key={u.id} value={u.code} className="text-xs">{u.code}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="taxPercent" render={({ field }) => (
                            <FormItem className="space-y-1">
                                <FormLabel className="text-xs">Tax %</FormLabel>
                                <FormControl><Input type="number" {...field} className="h-8 text-xs" /></FormControl>
                            </FormItem>
                        )} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                        <FormField control={form.control} name="alternativeUom" render={({ field }) => (
                            <FormItem className="space-y-1">
                                <FormLabel className="text-xs">Alt UOM</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || "__NONE__"}>
                                    <FormControl><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="None" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="__NONE__" className="text-xs">None</SelectItem>
                                        {uoms && uoms.map(u => (
                                            <SelectItem key={u.id} value={u.code} className="text-xs">{u.code}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="conversionFactor" render={({ field }) => (
                            <FormItem className="space-y-1">
                                <FormLabel className="text-xs">Conv. Factor</FormLabel>
                                <FormControl><Input type="number" placeholder="1 Alt = X" {...field} className="h-8 text-xs" /></FormControl>
                            </FormItem>
                        )} />
                    </div>
                    <Separator />
                     <div className="grid grid-cols-2 gap-2">
                        <FormField control={form.control} name="costPrice" render={({ field }) => (
                            <FormItem className="space-y-1">
                                <FormLabel className="text-xs">Cost Price</FormLabel>
                                <FormControl><Input type="number" {...field} className="h-8 text-xs" /></FormControl>
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="sellingPrice" render={({ field }) => (
                            <FormItem className="space-y-1">
                                <FormLabel className="text-xs">Selling Price</FormLabel>
                                <FormControl><Input type="number" {...field} className="h-8 text-xs" /></FormControl>
                            </FormItem>
                        )} />
                    </div>
                    <FormField control={form.control} name="minSellingPrice" render={({ field }) => (
                        <FormItem className="space-y-1">
                            <FormLabel className="text-xs">Min. Selling Price</FormLabel>
                            <FormControl><Input type="number" {...field} className="h-8 text-xs" /></FormControl>
                        </FormItem>
                    )} />
                </CardContent>
            </Card>

            {/* Column 3: Controls & Details */}
             <Card className="h-full">
                <CardHeader className="py-3 px-4 bg-muted/20 border-b"><CardTitle className="text-base">Controls & Defs</CardTitle></CardHeader>
                <CardContent className="p-4 space-y-3">
                     <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="isActive" render={({ field }) => (
                             <div className="flex flex-row items-center space-x-2 rounded-md border p-2 h-10">
                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                <div className="space-y-0 leading-none"><FormLabel className="text-xs">Active</FormLabel></div>
                            </div>
                        )} />
                         <FormField control={form.control} name="hasExpiry" render={({ field }) => (
                             <div className="flex flex-row items-center space-x-2 rounded-md border p-2 h-10">
                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                <div className="space-y-0 leading-none"><FormLabel className="text-xs">Expiry</FormLabel></div>
                            </div>
                        )} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="hasBatchNo" render={({ field }) => (
                             <div className="flex flex-row items-center space-x-2 rounded-md border p-2 h-10">
                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                <div className="space-y-0 leading-none"><FormLabel className="text-xs">Batch</FormLabel></div>
                            </div>
                        )} />
                         <FormField control={form.control} name="hasSerialNo" render={({ field }) => (
                             <div className="flex flex-row items-center space-x-2 rounded-md border p-2 h-10">
                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                <div className="space-y-0 leading-none"><FormLabel className="text-xs">Serial</FormLabel></div>
                            </div>
                        )} />
                    </div>
                    
                     <div className="grid grid-cols-2 gap-2 pt-2">
                        <FormField control={form.control} name="reorderLevel" render={({ field }) => (
                            <FormItem className="space-y-1">
                                <FormLabel className="text-xs">Reorder Lvl</FormLabel>
                                <FormControl><Input type="number" {...field} className="h-8 text-xs" /></FormControl>
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="reorderQty" render={({ field }) => (
                            <FormItem className="space-y-1">
                                <FormLabel className="text-xs">Reorder Qty</FormLabel>
                                <FormControl><Input type="number" {...field} className="h-8 text-xs" /></FormControl>
                            </FormItem>
                        )} />
                    </div>

                    <Separator className="my-2" />
                    
                    <FormField control={form.control} name="barcode" render={({ field }) => (
                        <FormItem className="space-y-1">
                            <FormLabel className="text-xs">Barcode</FormLabel>
                            <FormControl><Input {...field} className="h-8 text-xs" /></FormControl>
                        </FormItem>
                    )} />

                     <FormField control={form.control} name="description" render={({ field }) => (
                        <FormItem className="space-y-1">
                            <FormLabel className="text-xs">Description</FormLabel>
                            <FormControl><Textarea {...field} className="h-16 text-xs resize-none" placeholder="Included in auto-name" /></FormControl>
                        </FormItem>
                    )} />
                </CardContent>
            </Card>
        </div>
      </form>
    </Form>
  );
}
