"use client";

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
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createSupplier } from "@/actions/settings/create-supplier";

const formSchema = z.object({
  code: z.string().min(1, "Supplier code is required"),
  name: z.string().min(1, "Supplier name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  vatNumber: z.string().optional(),
  paymentTerms: z.string().optional(),
});

type SupplierFormValues = z.infer<typeof formSchema>;

interface SupplierFormProps {
  initialData?: any;
}

export function SupplierForm({ initialData }: SupplierFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      code: initialData.code || "",
      name: initialData.name || "",
      email: initialData.email || "",
      phone: initialData.phone || "",
      address: initialData.address || "",
      vatNumber: initialData.vatNumber || "",
      paymentTerms: initialData.paymentTerms || "",
    } : {
      code: "",
      name: "",
      email: "",
      phone: "",
      address: "",
    },
  });

  const onSubmit = async (data: SupplierFormValues) => {
    setLoading(true);
    try {
      // For now using placeholder companyId - in production, get from session
      const companyId = "00000000-0000-0000-0000-000000000000";
      const result = await createSupplier({
        name: data.name,
        code: data.code,
        email: data.email || undefined,
        phone: data.phone || undefined,
        address: data.address || undefined,
        taxId: data.vatNumber || undefined,
        paymentTerms: parseInt(data.paymentTerms || "30"),
      }, companyId);
      
      if (result.success) {
        toast.success("Supplier saved successfully");
        router.push("/settings/suppliers");
      } else {
        toast.error(result.error || "Failed to save supplier");
      }
    } catch (error) {
      toast.error("Failed to save supplier");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., SUPP001" {...field} />
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
                    <FormLabel>Supplier Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Company Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+971..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Full address..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vatNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>VAT Number (TRN)</FormLabel>
                    <FormControl>
                      <Input placeholder="100..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Terms (Days)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 30" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Update Supplier" : "Create Supplier"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
