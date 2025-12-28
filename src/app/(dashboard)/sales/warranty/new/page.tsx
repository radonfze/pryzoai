"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { GradientHeader } from "@/components/ui/gradient-header";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createWarrantyClaim } from "@/actions/sales/warranty";

const schema = z.object({
  claimNumber: z.string().min(1),
  customerId: z.string().uuid(),
  itemId: z.string().uuid(),
  serialNumber: z.string().optional(),
  issueDescription: z.string().min(5),
});

export default function NewWarrantyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
        customerId: "00000000-0000-0000-0000-000000000000", // placeholder
        itemId: "00000000-0000-0000-0000-000000000000", // placeholder
    }
  });

  async function onSubmit(vals: any) {
    setLoading(true);
    const res = await createWarrantyClaim(vals);
    setLoading(false);
    if (res.success) {
      toast.success("Claim Created");
      router.push("/sales/warranty");
    } else {
      toast.error(res.message);
    }
  }

  return (
    <div className="space-y-6">
      <GradientHeader module="sales" title="New Warranty Claim" description="Register defective item" icon="ShieldCheck" backUrl="/sales/warranty" />
      
      <div className="max-w-xl mx-auto p-6 bg-white rounded border">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField control={form.control} name="claimNumber" render={({ field }) => (
                <FormItem><FormLabel>Claim #</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
             )} />
             <div className="grid grid-cols-2 gap-4">
                 <FormField control={form.control} name="customerId" render={({ field }) => (
                    <FormItem><FormLabel>Customer (ID)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                 )} />
                 <FormField control={form.control} name="itemId" render={({ field }) => (
                    <FormItem><FormLabel>Item (ID)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                 )} />
             </div>
             <FormField control={form.control} name="serialNumber" render={({ field }) => (
                <FormItem><FormLabel>Serial Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
             )} />
             <FormField control={form.control} name="issueDescription" render={({ field }) => (
                <FormItem><FormLabel>Issue Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
             )} />
             
             <Button type="submit" disabled={loading} className="w-full">Submit Claim</Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
