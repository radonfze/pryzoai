"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Building } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GradientHeader } from "@/components/ui/gradient-header";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createAsset } from "@/actions/finance/assets";

const formSchema = z.object({
  assetName: z.string().min(2, "Name must be at least 2 characters"),
  assetCode: z.string().min(2, "Code required"),
  purchaseCost: z.string().or(z.number()),
  purchaseDate: z.string(),
  categoryId: z.string().uuid(),
  usefulLife: z.string().or(z.number()),
});

export default function NewAssetPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoryId: "00000000-0000-0000-0000-000000000000", // Placeholder until categories fetched
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true);
      const result = await createAsset({
          ...values, 
          // ensure number conversion
          purchaseCost: Number(values.purchaseCost),
          usefulLifeColumns: Number(values.usefulLife)
      });
      
      if (result.success) {
        toast.success("Asset created successfully");
        router.push("/finance/assets");
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <GradientHeader
        module="finance"
        title="New Fixed Asset"
        description="Register a new asset"
        icon={Building}
        backUrl="/finance/assets"
      />

      <div className="max-w-xl mx-auto p-6 bg-white rounded-lg border shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="assetName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Asset Name</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g. Dell XPS 15" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="assetCode"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Asset Code</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g. FA-001" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="purchaseCost"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Purchase Cost</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="purchaseDate"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Purchase Date</FormLabel>
                    <FormControl>
                        <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

             <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset Category</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="00000000-0000-0000-0000-000000000000">Computers (Placeholder)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

             <FormField
                control={form.control}
                name="usefulLife"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Useful Life (Years)</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.5" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Register Asset"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
