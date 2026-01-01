"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { createBrand, updateBrand } from "@/actions/inventory/brands";
import { Switch } from "@/components/ui/switch";

import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  nameAr: z.string().optional(),
  website: z.string().optional(),
  isActive: z.boolean().default(true),
  categoryIds: z.array(z.string()).optional(),
});

type BrandFormValues = z.infer<typeof formSchema>;

interface BrandFormProps {
  initialData?: any;
  categories: any[];
  initialCode?: string;
}

export function BrandForm({ initialData, categories = [], initialCode }: BrandFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<BrandFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      ...initialData,
      categoryIds: initialData.categoryMappings?.map((m: any) => m.categoryId) || []
    } : {
      code: initialCode || "",
      name: "",
      nameAr: "",
      website: "",
      isActive: true,
      categoryIds: [],
    },
  });

  const onSubmit = async (data: BrandFormValues) => {
    setLoading(true);
    try {
      if (initialData) {
        const res = await updateBrand(initialData.id, data);
        if (res.success) {
          toast.success("Brand updated successfully");
          router.push("/inventory/brands");
          router.refresh();
        } else {
          toast.error(res.error as string);
        }
      } else {
        const res = await createBrand(data);
        if (res.success) {
          toast.success("Brand created successfully");
          router.push("/inventory/brands");
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
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input placeholder="BRD-001" {...field} readOnly className="bg-muted pl-10" />
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
                      <Input placeholder="Brand Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormItem className="col-span-full">
                <FormLabel>Linked Categories</FormLabel>
                <Card>
                    <CardContent className="p-4 h-48 overflow-y-auto grid grid-cols-2 gap-4">
                         <FormField
                            control={form.control}
                            name="categoryIds"
                            render={() => (
                                <>
                                {categories.map((category) => (
                                    <FormField
                                        key={category.id}
                                        control={form.control}
                                        name="categoryIds"
                                        render={({ field }) => {
                                            return (
                                                <FormItem
                                                    key={category.id}
                                                    className="flex flex-row items-start space-x-3 space-y-0"
                                                >
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value?.includes(category.id)}
                                                            onCheckedChange={(checked) => {
                                                                return checked
                                                                    ? field.onChange([...(field.value || []), category.id])
                                                                    : field.onChange(
                                                                        field.value?.filter(
                                                                            (value) => value !== category.id
                                                                        )
                                                                    )
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormLabel className="font-normal cursor-pointer">
                                                        {category.name} ({category.code})
                                                    </FormLabel>
                                                </FormItem>
                                            )
                                        }}
                                    />
                                ))}
                                </>
                            )}
                        />
                    </CardContent>
                </Card>
              </FormItem>

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
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm col-span-full">
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
            </div>

            <div className="flex items-center justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? "Update Brand" : "Create Brand"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
