"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createItem } from "@/actions/settings/create-item";
import { getNextCode } from "@/actions/settings/auto-code";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  sku: z.string().min(1, "SKU is required"),
  itemType: z.enum(["product", "service", "consumable"]),
  uom: z.string().min(1, "Unit of measure is required"),
  sellingPrice: z.coerce.number().min(0).default(0),
  costPrice: z.coerce.number().min(0).default(0),
  taxable: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

export default function NewItemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(true);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      sku: "",
      itemType: "product",
      uom: "PCS",
      sellingPrice: 0,
      costPrice: 0,
      taxable: true,
    },
  });

  // Auto-fetch next item SKU on mount
  useEffect(() => {
    async function fetchNextCode() {
      try {
        const result = await getNextCode("ITEM", "00000000-0000-0000-0000-000000000000");
        if (result.success && (result.preview || result.code)) {
          form.setValue("sku", result.preview || result.code || "");
        }
      } catch (error) {
        console.error("Failed to fetch next code:", error);
      } finally {
        setCodeLoading(false);
      }
    }
    fetchNextCode();
  }, [form]);

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      const res = await createItem(data, "00000000-0000-0000-0000-000000000000");
      if (res.success) {
        router.push("/settings/items");
      } else {
        alert("Failed to create item: " + res.error);
      }
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">New Item</h2>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Item Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Office Chair" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU * <span className="text-xs text-muted-foreground">(Auto-generated)</span></FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            {...field} 
                            readOnly 
                            className="bg-muted pr-8"
                          />
                          {codeLoading && (
                            <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="itemType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="product">Product</SelectItem>
                          <SelectItem value="service">Service</SelectItem>
                          <SelectItem value="consumable">Consumable</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="uom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit of Measure *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select UOM" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PCS">Pieces (PCS)</SelectItem>
                          <SelectItem value="KG">Kilogram (KG)</SelectItem>
                          <SelectItem value="LTR">Liter (LTR)</SelectItem>
                          <SelectItem value="MTR">Meter (MTR)</SelectItem>
                          <SelectItem value="BOX">Box</SelectItem>
                          <SelectItem value="SET">Set</SelectItem>
                          <SelectItem value="HR">Hour (HR)</SelectItem>
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
                  name="sellingPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selling Price (AED)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="costPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost Price (AED)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Item"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
