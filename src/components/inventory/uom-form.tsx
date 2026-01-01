"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createUom, updateUom } from "@/actions/inventory/uom";
import { Loader2, Save, X } from "lucide-react";

const formSchema = z.object({
  code: z.string().min(1, "Code is required").max(20, "Code too long"),
  name: z.string().min(1, "Name is required").max(50, "Name too long"),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface UomFormProps {
  initialData?: {
    id: string;
    code: string;
    name: string;
    isActive: boolean;
  };
}

export function UomForm({ initialData }: UomFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEditing = !!initialData;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      code: initialData.code,
      name: initialData.name,
      isActive: initialData.isActive,
    } : {
      code: "",
      name: "",
      isActive: true,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      let result;
      if (isEditing) {
        result = await updateUom(initialData.id, values);
      } else {
        result = await createUom(values);
      }
      
      if (result.success) {
        toast.success(isEditing ? "UOM updated successfully" : "UOM created successfully");
        router.push("/inventory/uom");
        router.refresh();
      } else {
        toast.error(typeof result.error === 'string' ? result.error : "Failed to save UOM");
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>UOM Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., PCS, KG, MTR" {...field} />
                    </FormControl>
                    <FormDescription>Short code for the unit</FormDescription>
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
                      <Input placeholder="e.g., Pieces, Kilograms, Meters" {...field} />
                    </FormControl>
                    <FormDescription>Full name of the unit</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active</FormLabel>
                    <FormDescription>
                      Inactive UOMs won&apos;t appear in selection dropdowns
                    </FormDescription>
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
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/inventory/uom")}
            disabled={loading}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {initialData ? "Update UOM" : "Create UOM"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
