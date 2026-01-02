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
import { Card, CardContent } from "@/components/ui/card";
import { ChevronsUpDown, Check, Lock, Loader2 } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { createSubcategory, updateSubcategory } from "@/actions/inventory/subcategories";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  // categoryId: z.string().min(1, "Category is required"), // Deprecated
  categoryIds: z.array(z.string()).min(1, "At least one Category is required"), // New
  nameAr: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type SubcategoryFormValues = z.infer<typeof formSchema>;

interface SubcategoryFormProps {
  initialData?: any;
  categories: { id: string; name: string }[];
  initialCode?: string;
}

export function SubcategoryForm({ initialData, categories, initialCode }: SubcategoryFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const form = useForm<SubcategoryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
        ...initialData,
        categoryIds: initialData.categoryIds || (initialData.categoryId ? [initialData.categoryId] : [])
    } : {
      code: initialCode || "",
      name: "",
      categoryIds: [],
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
                name="categoryIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categories *</FormLabel>
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className={cn(
                              "w-full justify-between",
                              !field.value || field.value.length === 0 ? "text-muted-foreground" : ""
                            )}
                          >
                            {field.value && field.value.length > 0
                              ? `${field.value.length} selected`
                              : "Select categories..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search category..." />
                          <CommandList>
                            <CommandEmpty>No category found.</CommandEmpty>
                            <CommandGroup>
                              {categories.map((category) => (
                                <CommandItem
                                  key={category.id}
                                  value={category.name}
                                  onSelect={() => {
                                    const current = field.value || [];
                                    const isSelected = current.includes(category.id);
                                    if (isSelected) {
                                      field.onChange(current.filter((id) => id !== category.id));
                                    } else {
                                      field.onChange([...current, category.id]);
                                    }
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value?.includes(category.id)
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {category.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                       Select at least one parent category.
                    </FormDescription>
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
                            <Input placeholder="SUB-001" {...field} readOnly className="bg-muted pl-10" />
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
