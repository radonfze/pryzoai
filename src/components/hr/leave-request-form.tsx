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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { differenceInBusinessDays, differenceInDays, parseISO } from "date-fns";

// Schema validation
const formSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  leaveType: z.string().min(1, "Leave Type is required"),
  startDate: z.string().min(1, "Start Date is required"),
  endDate: z.string().min(1, "End Date is required"),
  days: z.number().min(0.5, "Days must be at least 0.5"),
  reason: z.string().optional(),
});

type LeaveFormValues = z.infer<typeof formSchema>;

interface LeaveRequestFormProps {
  employees: any[];
  initialData?: any; // For edit mode
}

export function LeaveRequestForm({ employees, initialData }: LeaveRequestFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const defaultValues: Partial<LeaveFormValues> = initialData ? {
    employeeId: initialData.employeeId,
    leaveType: initialData.leaveType,
    startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : "",
    endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : "",
    days: Number(initialData.days),
    reason: initialData.reason || "",
  } : {
    leaveType: "annual",
    days: 0,
  };

  const form = useForm<LeaveFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Auto-calculate days when dates change
  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");

  useEffect(() => {
    if (startDate && endDate) {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      
      if (end >= start) {
        // Simple day difference inclusive
        const diff = differenceInDays(end, start) + 1;
        form.setValue("days", diff);
      } else {
        form.setValue("days", 0);
      }
    }
  }, [startDate, endDate, form.setValue]);

  const onSubmit = async (data: LeaveFormValues) => {
    setLoading(true);
    try {
        // TODO: Replace with actual Server Action call
        console.log("Submitting Leave Request:", data);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        toast.success(initialData ? "Leave request updated" : "Leave request submitted");
        router.push("/hr/leaves");
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <FormField
                    control={form.control}
                    name="employeeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employee *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!initialData}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select employee..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {employees.map((e) => (
                              <SelectItem key={e.id} value={e.id}>
                                {e.firstName} {e.lastName} ({e.employeeCode})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                <div className="grid gap-4 md:grid-cols-2">
                   <FormField
                    control={form.control}
                    name="leaveType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Leave Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="annual">Annual Leave</SelectItem>
                            <SelectItem value="sick">Sick Leave</SelectItem>
                            <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                            <SelectItem value="maternity">Maternity Leave</SelectItem>
                            <SelectItem value="emergency">Emergency Leave</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="days"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Days</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.5" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                   <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date *</FormLabel>
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
                        <FormLabel>End Date *</FormLabel>
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
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason / Notes</FormLabel>
                        <FormControl>
                          <Input placeholder="Reason for leave..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between font-medium text-sm">
                            <span>Balance (Annual)</span>
                            <span className="text-muted-foreground">Checking...</span> 
                            {/* In real app, fetch balance dynamically */}
                        </div>
                         <div className="flex justify-between font-medium text-sm">
                            <span>Status</span>
                            <span className="capitalize">{initialData?.status || "Draft"}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                 <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {initialData ? "Update Request" : "Submit Request"}
                 </Button>
                 <Button type="button" variant="outline" className="w-full" onClick={() => router.back()}>
                    Cancel
                 </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}
