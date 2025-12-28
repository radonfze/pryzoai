"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { updateEmployee } from "@/actions/hr/employees";

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  designation: z.string().optional(),
  basicSalary: z.string().optional(),
  housingAllowance: z.string().optional(),
  transportAllowance: z.string().optional(),
  bankName: z.string().optional(),
  bankIban: z.string().optional(),
  routingCode: z.string().optional(),
  laborCardNo: z.string().optional(),
});

export function EmployeeEditForm({ initialData }: any) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            firstName: initialData.firstName,
            lastName: initialData.lastName,
            designation: initialData.designation || "",
            basicSalary: initialData.basicSalary?.toString() || "0",
            housingAllowance: initialData.housingAllowance?.toString() || "0",
            transportAllowance: initialData.transportAllowance?.toString() || "0",
            bankName: initialData.bankName || "",
            bankIban: initialData.bankIban || "",
            routingCode: initialData.routingCode || "",
            laborCardNo: initialData.laborCardNo || "",
        }
    });

    async function onSubmit(vals: any) {
        setLoading(true);
        const res = await updateEmployee(initialData.id, vals);
        setLoading(false);
        if (res.success) {
            toast.success("Updated Successfully");
            router.push("/hr/employees");
        } else {
            toast.error(res.message);
        }
    }

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded border">
             <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="firstName" render={({ field }) => (
                            <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="lastName" render={({ field }) => (
                            <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                    
                    <FormField control={form.control} name="designation" render={({ field }) => (
                            <FormItem><FormLabel>Designation</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />

                    <div className="p-4 bg-gray-50 rounded space-y-4">
                        <h3 className="font-semibold">Salary Details</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <FormField control={form.control} name="basicSalary" render={({ field }) => (
                                <FormItem><FormLabel>Basic</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="housingAllowance" render={({ field }) => (
                                <FormItem><FormLabel>Housing</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="transportAllowance" render={({ field }) => (
                                <FormItem><FormLabel>Transport</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded space-y-4">
                        <h3 className="font-semibold text-blue-900">WPS Compliance (Bank)</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="bankIban" render={({ field }) => (
                                <FormItem><FormLabel>IBAN</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="routingCode" render={({ field }) => (
                                <FormItem><FormLabel>Agnet Routing Code (Bank)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="laborCardNo" render={({ field }) => (
                                <FormItem><FormLabel>Labour Card No (Person ID)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                    </div>

                    <Button className="w-full" disabled={loading}>Update Employee</Button>
                </form>
             </Form>
        </div>
    )
}
