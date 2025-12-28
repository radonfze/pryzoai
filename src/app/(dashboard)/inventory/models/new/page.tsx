"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { GradientHeader } from "@/components/ui/gradient-header";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
// Action needed here

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().min(2, "Code must be at least 2 characters"),
  brandId: z.string().min(1, "Brand is required"),
  subcategoryId: z.string().min(1, "Subcategory is required"),
});

export default function NewModelPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Stub submit
    toast.success("Model created!");
    router.push("/inventory/models");
  }

  return (
    <div className="space-y-6">
      <GradientHeader
        module="inventory"
        title="New Model"
        description="Create a new item model/variant"
        icon="Boxes"
        backUrl="/inventory/models"
      />

      <div className="max-w-xl mx-auto p-6 bg-white rounded-lg border shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
             <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. EOS R5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. MOD-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Placeholder for Brand/Subcategory Selects */}
            
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Model"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
