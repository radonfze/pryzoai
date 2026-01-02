"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createBomAction, updateBom } from "@/actions/inventory/bom";
import { toast } from "sonner";

const bomLineSchema = z.object({
  itemId: z.string().min(1, "Component is required"),
  quantity: z.coerce.number().min(0.0001, "Quantity must be > 0"),
  uom: z.string().optional(),
  notes: z.string().optional(),
});

const formSchema = z.object({
  itemId: z.string().min(1, "Parent Item is required"),
  name: z.string().min(1, "BOM Name is required"),
  isActive: z.boolean().default(true),
  lines: z.array(bomLineSchema).min(1, "At least one component is required"),
});

interface BomFormProps {
  items: any[];
  initialData?: any;
  isEdit?: boolean;
}

export default function BomForm({ items, initialData, isEdit = false }: BomFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const defaultValues = initialData ? {
    itemId: initialData.itemId || initialData.finishedItemId, // Handle mapped field
    name: initialData.name || initialData.bomName,
    isActive: initialData.isActive,
    lines: initialData.lines?.map((l: any) => ({
        itemId: l.itemId || l.componentItemId,
        quantity: parseFloat(l.quantity),
        uom: l.uom,
        notes: l.notes
    })) || [{ itemId: "", quantity: 1, uom: "", notes: "" }]
  } : {
      itemId: "",
      name: "",
      isActive: true,
      lines: [{ itemId: "", quantity: 1, uom: "", notes: "" }],
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });

  const selectedParentId = form.watch("itemId");

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
        let res;
        if (isEdit && initialData) {
            res = await updateBom(initialData.id, values);
        } else {
            res = await createBomAction(values);
        }

        if (res.success) {
            toast.success(isEdit ? "BOM Updated Successfully" : "BOM Created Successfully");
            router.push("/inventory/bom");
            router.refresh();
        } else {
            toast.error(typeof res.error === 'string' ? res.error : "Validation failed");
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
                {isEdit ? "Update BOM" : "Save BOM"}
            </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader><CardTitle>BOM Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                     <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem>
                            <FormLabel>BOM Name *</FormLabel>
                            <FormControl><Input placeholder="e.g. Standard Assembly" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="itemId" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Parent Item (Product) *</FormLabel>
                            <Select onValueChange={(val) => {
                                field.onChange(val);
                                const item = items.find(i => i.id === val);
                                if (item && !form.getValues("name")) {
                                    form.setValue("name", `${item.name} - Standard`);
                                }
                            }} defaultValue={field.value} disabled={isEdit}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select Parent Item" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {items.map(i => <SelectItem key={i.id} value={i.id}>{i.code} - {i.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                     <FormField control={form.control} name="isActive" render={({ field }) => (
                         <div className="flex flex-row items-center space-x-3 rounded-md border p-4">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            <div className="space-y-1 leading-none"><FormLabel>Active Formula</FormLabel></div>
                        </div>
                    )} />
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Components (Ingredients)</CardTitle>
                <Button type="button" variant="secondary" size="sm" onClick={() => append({ itemId: "", quantity: 1, uom: "", notes: "" })}>
                    <Plus className="mr-2 h-4 w-4" /> Add Line
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-4 items-end border-b pb-4">
                        <FormField control={form.control} name={`lines.${index}.itemId`} render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>Component Item</FormLabel>
                                <Select onValueChange={(val) => {
                                    field.onChange(val);
                                    const item = items.find(i => i.id === val);
                                    if (item?.uom) {
                                        form.setValue(`lines.${index}.uom`, item.uom);
                                    }
                                }} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select Component" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {items
                                            .filter(i => i.id !== selectedParentId)
                                            .map(i => <SelectItem key={i.id} value={i.id}>{i.code} - {i.name}</SelectItem>)
                                        }
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )} />
                        
                        <FormField control={form.control} name={`lines.${index}.quantity`} render={({ field }) => (
                            <FormItem className="w-[120px]">
                                <FormLabel>Quantity</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                            </FormItem>
                        )} />

                        <FormField control={form.control} name={`lines.${index}.uom`} render={({ field }) => (
                            <FormItem className="w-[120px]">
                                <FormLabel>UOM</FormLabel>
                                <FormControl><Input {...field} readOnly className="bg-muted" /></FormControl>
                            </FormItem>
                        )} />
                        
                         <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="mb-2 text-destructive">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                 {fields.length === 0 && <div className="text-center text-muted-foreground py-4">No components details. Add a line to start.</div>}
            </CardContent>
        </Card>

      </form>
    </Form>
  );
}
