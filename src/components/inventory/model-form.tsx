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

import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { createModel, updateModel } from "@/actions/inventory/models";
import { Switch } from "@/components/ui/switch";

const formSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  brandId: z.string().min(1, "Brand is required"),
  subcategoryId: z.string().min(1, "Subcategory is required"),
  nameAr: z.string().optional(),
  description: z.string().optional(),
  specifications: z.string().optional(),
  isActive: z.boolean().default(true),
});

type ModelFormValues = z.infer<typeof formSchema>;

interface ModelFormProps {
  initialData?: any;
  brands: { id: string; name: string }[];
  subcategories: { id: string; name: string }[];
  initialCode?: string;
}

export function ModelForm({ initialData, brands, subcategories, initialCode }: ModelFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<ModelFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      code: initialCode || "",
      name: "",
      brandId: "",
      subcategoryId: "",
      nameAr: "",
      description: "",
      specifications: "",
      isActive: true,
    },
  });

  const onSubmit = async (data: ModelFormValues) => {
    setLoading(true);
    try {
      if (initialData) {
        const res = await updateModel(initialData.id, data);
        if (res.success) {
          toast.success("Model updated successfully");
          router.push("/inventory/models");
          router.refresh();
        } else {
          toast.error(res.error as string);
        }
      } else {
        const res = await createModel(data);
        if (res.success) {
          toast.success("Model created successfully");
          router.push("/inventory/models");
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
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="brandId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a brand" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {brands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id}>
                            {brand.name}
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
                name="subcategoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subcategory *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a subcategory" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subcategories.map((sub) => (
                          <SelectItem key={sub.id} value={sub.id}>
                            {sub.name}
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
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code *</FormLabel>
                    <FormControl>
                        <div className="relative">
                            <Input placeholder="MOD-001" {...field} readOnly className="bg-muted pl-10" />
                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        </div>
                    </FormControl>
                    <FormDescription>Code is auto-generated</FormDescription>
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
                      <Input placeholder="Model Name" {...field} />
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
                      <Input placeholder="الاسم" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
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
                      <Textarea placeholder="Description..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="specifications"
                render={({ field }) => (
                  <FormItem className="col-span-full">
                    <FormLabel>Specifications</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Specs..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? "Update Model" : "Create Model"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
