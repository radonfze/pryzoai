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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createSubcategory, updateSubcategory } from "@/actions/inventory/subcategories";
import { Switch } from "@/components/ui/switch";

const formSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  categoryId: z.string().min(1, "Category is required"),
  nameAr: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type SubcategoryFormValues = z.infer<typeof formSchema>;

interface SubcategoryFormProps {
  initialData?: any;
  categories: { id: string; name: string }[];
}

export function SubcategoryForm({ initialData, categories }: SubcategoryFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<SubcategoryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      code: "",
      name: "",
      categoryId: "",
      nameAr: "",
      description: "",
      isActive: true,
    },
  });

  const onSubmit = async (data: SubcategoryFormValues) => {
    setLoading(true);
    try {
      if (initialData) {
        const res = await updateSubcategory(initialData.id, data);
        if (res.success) {
          toast.success("Subcategory updated successfully");
          router.push("/inventory/subcategories");
          router.refresh();
        } else {
          toast.error(res.error as string);
        }
      } else {
        const res = await createSubcategory(data);
        if (res.success) {
          toast.success("Subcategory created successfully");
          router.push("/inventory/subcategories");
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
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
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
                      <Input placeholder="SUB-001" {...field} />
                    </FormControl>
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
                      <Input placeholder="Subcategory Name" {...field} />
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
            </div>

            <div className="flex items-center justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? "Update Subcategory" : "Create Subcategory"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
