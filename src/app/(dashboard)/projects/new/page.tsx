"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GradientHeader } from "@/components/ui/gradient-header";
import { toast } from "sonner";
import { createProjectAction } from "@/actions/projects/create";

const formSchema = z.object({
  type: z.enum(["installation", "amc", "time_material"]),
  code: z.string().min(2),
  name: z.string().min(2),
  customerId: z.string().uuid(),
  startDate: z.string(),
  endDate: z.string().optional(),
  contractValue: z.string().optional(),
  visitFrequency: z.enum(["monthly", "quarterly", "yearly"]).optional(),
});

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "installation",
      customerId: "00000000-0000-0000-0000-000000000000", // Placeholder
      visitFrequency: "monthly"
    },
  });

  const projectType = form.watch("type");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true);
      const res = await createProjectAction({
        ...values,
        contractValue: values.contractValue ? Number(values.contractValue) : undefined
      });

      if (res.success) {
        toast.success("Project created successfully");
        router.push("/projects");
      } else {
        toast.error(res.message);
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
        module="projects"
        title="New Project"
        description="Unified Project Wizard"
        icon="Briefcase"
        backUrl="/projects"
      />

      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg border shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Type</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="installation">Installation Project</SelectItem>
                      <SelectItem value="amc">AMC Contract</SelectItem>
                      <SelectItem value="time_material">Time & Material</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
                 <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Project Code</FormLabel>
                    <FormControl>
                        <Input placeholder="PRJ-001" {...field} />
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
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                        <Input placeholder="Office Renovation" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                 <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                        <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                  <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                        <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            {projectType === "amc" && (
                <div className="p-4 bg-blue-50 rounded-md border border-blue-100 space-y-4">
                    <h3 className="font-semibold text-blue-900">AMC Details</h3>
                     <FormField
                    control={form.control}
                    name="contractValue"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Contract Value</FormLabel>
                        <FormControl>
                            <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                      <FormField
                    control={form.control}
                    name="visitFrequency"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Visit Frequency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Frequency" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
            )}

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
