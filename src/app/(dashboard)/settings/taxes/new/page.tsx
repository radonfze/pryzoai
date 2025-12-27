"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  code: z.string().min(1, "Code is required"),
  rate: z.coerce.number().min(0).max(100),
  type: z.enum(["standard", "zero", "exempt"]),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function NewTaxPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      code: "",
      rate: 5,
      type: "standard",
      description: "",
    },
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      // TODO: Save to database
      console.log("Tax data:", data);
      router.push("/settings/taxes");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">New Tax</h2>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Tax Configuration</CardTitle>
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
                      <FormLabel>Tax Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. UAE VAT 5%" {...field} />
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
                      <FormLabel>Tax Code *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. VAT5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rate (%) *</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="standard">Standard Rate</SelectItem>
                          <SelectItem value="zero">Zero Rated</SelectItem>
                          <SelectItem value="exempt">Exempt</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Tax"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="max-w-2xl rounded-md border p-4 bg-muted/30">
        <h3 className="font-semibold mb-2">UAE VAT Reference</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>Standard Rate (5%)</strong> - Most goods and services</li>
          <li>• <strong>Zero Rated (0%)</strong> - Exports, international transport, certain healthcare/education</li>
          <li>• <strong>Exempt</strong> - Local passenger transport, bare land, certain financial services</li>
        </ul>
      </div>
    </div>
  );
}
