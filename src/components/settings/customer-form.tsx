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
import { createCustomer } from "@/actions/settings/create-customer";

const formSchema = z.object({
  code: z.string().min(1, "Customer code is required"),
  name: z.string().min(1, "Customer name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  vatNumber: z.string().optional(),
  creditLimit: z.number().min(0).optional(),
  paymentTerms: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof formSchema>;

interface CustomerFormProps {
  initialData?: any;
}

export function CustomerForm({ initialData }: CustomerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      code: initialData.code || "",
      name: initialData.name || "",
      email: initialData.email || "",
      phone: initialData.phone || "",
      address: initialData.address || "",
      vatNumber: initialData.vatNumber || "",
      creditLimit: Number(initialData.creditLimit) || 0,
      paymentTerms: initialData.paymentTerms || "",
    } : {
      code: "",
      name: "",
      email: "",
      phone: "",
      address: "",
      creditLimit: 0,
    },
  });

  const onSubmit = async (data: CustomerFormValues) => {
    setLoading(true);
    try {
      // For now using placeholder companyId - in production, get from session
      const companyId = "00000000-0000-0000-0000-000000000000";
      const result = await createCustomer({
        name: data.name,
        code: data.code,
        email: data.email || undefined,
        phone: data.phone || undefined,
        address: data.address || undefined,
        taxId: data.vatNumber || undefined,
        creditLimit: data.creditLimit,
      }, companyId);
      
      if (result.success) {
        toast.success("Customer saved successfully");
        router.push("/settings/customers");
      } else {
        toast.error(result.error || "Failed to save customer");
      }
    } catch (error) {
      toast.error("Failed to save customer");
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
                    <FormLabel>Customer Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., CUST001" {...field} />
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
                    <FormLabel>Customer Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Company or Individual Name" {...field} />
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
                name="creditLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credit Limit (AED)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
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
            {initialData ? "Update Customer" : "Create Customer"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
