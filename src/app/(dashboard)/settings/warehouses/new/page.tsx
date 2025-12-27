"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createWarehouse } from "@/actions/settings/create-warehouse";
import { getNextCode } from "@/actions/settings/auto-code";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().min(1, "Warehouse code is required"),
  address: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function NewWarehousePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(true);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      code: "",
      address: "",
    },
  });

  // Auto-fetch next warehouse code on mount
  useEffect(() => {
    async function fetchNextCode() {
      try {
        const result = await getNextCode("WH", "00000000-0000-0000-0000-000000000000");
        if (result.success && (result.preview || result.code)) {
          form.setValue("code", result.preview || result.code || "");
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
      const res = await createWarehouse(data, "00000000-0000-0000-0000-000000000000");
      if (res.success) {
        router.push("/settings/warehouses");
      } else {
        alert("Failed to create warehouse: " + res.error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">New Warehouse</h2>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Warehouse Information</CardTitle>
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
                      <FormLabel>Warehouse Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Main Warehouse" {...field} />
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
                      <FormLabel>Warehouse Code * <span className="text-xs text-muted-foreground">(Auto-generated)</span></FormLabel>
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

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Warehouse location address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Warehouse"}
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
