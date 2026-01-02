"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Scale, Lock } from "lucide-react";
import { toast } from "sonner";
import { createCategory, updateCategory } from "@/actions/inventory/categories";
import { Switch } from "@/components/ui/switch";

const formSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  nameAr: z.string().optional(),
  description: z.string().optional(),
  baseUomId: z.string().optional().nullable(),
  alternativeUomId: z.string().optional().nullable(),
  conversionFactor: z.coerce.number().positive("Must be > 0").optional().nullable(),
  isActive: z.boolean().default(true),
});

type CategoryFormValues = z.infer<typeof formSchema>;

interface Uom {
  id: string;
  code: string;
  name: string;
}

interface CategoryFormProps {
  initialData?: any;
  initialCode?: string;
  uoms?: Uom[];
}

export function CategoryForm({ initialData, initialCode, uoms = [] }: CategoryFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEditing = !!initialData;

  // Find default UOM (Pcs / PCS / pcs)
  const defaultBaseUomId = uoms.find(u => u.name.toLowerCase() === "pcs")?.id || null;

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      ...initialData,
      conversionFactor: initialData.conversionFactor ? Number(initialData.conversionFactor) : undefined,
    } : {
      code: initialCode || "",
      name: "",
      nameAr: "",
      description: "",
      baseUomId: defaultBaseUomId,
      alternativeUomId: null, // Default to None
      conversionFactor: undefined,
      isActive: true,
    },
  });

  const alternativeUomId = form.watch("alternativeUomId");
  const baseUomId = form.watch("baseUomId");
  
  // Get selected UOM names for display
  const baseUomName = uoms.find(u => u.id === baseUomId)?.name || "Base";
  const altUomName = uoms.find(u => u.id === alternativeUomId)?.name || "Alternative";

  const onSubmit = async (data: CategoryFormValues) => {
    setLoading(true);
    try {
      // Clean up empty strings to null
      const cleanData = {
        ...data,
        baseUomId: data.baseUomId || null,
        alternativeUomId: data.alternativeUomId || null,
        conversionFactor: data.alternativeUomId && data.conversionFactor ? data.conversionFactor : null,
      };

      if (initialData) {
        const res = await updateCategory(initialData.id, cleanData);
        if (res.success) {
          toast.success("Category updated successfully");
          router.push("/inventory/categories");
          router.refresh();
        } else {
          toast.error(res.error as string);
        }
      } else {
        const res = await createCategory(cleanData);
        if (res.success) {
          toast.success("Category created successfully");
          router.push("/inventory/categories");
          router.refresh();
        } else {
          toast.error(res.error as string);
        }
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Category Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code *</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input 
                          placeholder="CAT1" 
                          {...field} 
                          readOnly={!isEditing}
                          className={!isEditing ? "bg-muted font-mono" : ""}
                        />
                      </FormControl>
                      {!isEditing && (
                        <div className="flex items-center justify-center w-10 h-10 rounded-md bg-muted">
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    {!isEditing && <FormDescription>Auto-generated, read-only</FormDescription>}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Electronics" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nameAr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name (Arabic)</FormLabel>
                    <FormControl>
                      <Input placeholder="الإلكترونيات" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="col-span-full">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Category description..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* UOM Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Unit of Measure Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="baseUomId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base UOM</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select UOM" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {uoms.map((uom) => (
                          <SelectItem key={uom.id} value={uom.id}>
                            {uom.code} - {uom.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Primary unit for items in this category
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="alternativeUomId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alternative UOM</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === "__NONE__" ? null : value)} 
                      value={field.value || "__NONE__"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__NONE__">None</SelectItem>
                        {uoms.map((uom) => (
                          <SelectItem key={uom.id} value={uom.id}>
                            {uom.code} - {uom.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Secondary unit (optional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField

                control={form.control}
                name="conversionFactor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conversion Factor</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.0001"
                        placeholder="e.g., 12" 
                        disabled={!alternativeUomId}
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>
                      {alternativeUomId && baseUomId
                        ? `How many ${baseUomName} = 1 ${altUomName}` 
                        : alternativeUomId 
                          ? "Select base UOM first"
                          : "Select alternative UOM first"
                      }
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Update Category" : "Create Category"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
