"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Plus, Trash2 } from "lucide-react";
import { createManualJournal } from "@/actions/finance/create-journal";
import { useState } from "react";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  entryDate: z.string(),
  description: z.string().min(3, "Description is required"),
  reference: z.string().optional(),
  lines: z.array(z.object({
    accountId: z.string().min(1, "Account is required"),
    debit: z.coerce.number().min(0),
    credit: z.coerce.number().min(0),
    description: z.string().optional(),
  })).min(2, "Minimum 2 lines required")
});

type FormData = z.infer<typeof formSchema>;

export default function JournalEntryForm({ accounts }: { accounts: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      entryDate: new Date().toISOString().split("T")[0],
      description: "",
      lines: [
          { accountId: "", debit: 0, credit: 0, description: "" },
          { accountId: "", debit: 0, credit: 0, description: "" }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines"
  });

  async function onSubmit(data: FormData) {
     // Client check balance
     const totalDr = data.lines.reduce((s, l) => s + Number(l.debit), 0);
     const totalCr = data.lines.reduce((s, l) => s + Number(l.credit), 0);
     if (Math.abs(totalDr - totalCr) > 0.01) {
         form.setError("root", { message: `Unbalanced! Difference: ${totalDr - totalCr}` });
         return;
     }

    setLoading(true);
    try {
        const res = await createManualJournal(data, "00000000-0000-0000-0000-000000000000");
        if (res.success) {
            router.push("/finance/journals");
        } else {
             // @ts-ignore
             const msg = res.error?.fieldErrors ? JSON.stringify(res.error.fieldErrors) : "Failed";
             form.setError("root", { message: msg });
             alert("Failed: " + msg);
        }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex items-center justify-between">
           <h2 className="text-3xl font-bold tracking-tight">New Journal Entry</h2>
           <Button type="submit" disabled={loading}>{loading ? "Posting..." : "Post Entry"}</Button>
        </div>
        {form.formState.errors.root && (
            <div className="text-red-500 font-bold">{form.formState.errors.root.message}</div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
             <FormField
              control={form.control}
              name="entryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Description</FormLabel>
                  <FormControl><Input {...field} placeholder="e.g. Opening Balance Adjustment" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>

        <Card>
            <CardContent className="pt-6">
                 <div className="space-y-4">
                     <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground mb-2 px-2">
                         <div className="col-span-5">Account</div>
                         <div className="col-span-3">Description</div>
                         <div className="col-span-2 text-right">Debit</div>
                         <div className="col-span-2 text-right">Credit</div>
                     </div>
                    {fields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-5">
                                 <FormField
                                    control={form.control}
                                    name={`lines.${index}.accountId`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Account" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {accounts.map(a => (
                                                        <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="col-span-3">
                                <FormField
                                    control={form.control}
                                    name={`lines.${index}.description`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl><Input {...field} /></FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                             <div className="col-span-2">
                                <FormField
                                    control={form.control}
                                    name={`lines.${index}.debit`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl><Input type="number" className="text-right" {...field} /></FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="col-span-2 flex gap-2">
                                <FormField
                                    control={form.control}
                                    name={`lines.${index}.credit`}
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormControl><Input type="number" className="text-right" {...field} /></FormControl>
                                        </FormItem>
                                    )}
                                />
                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    <Button type="button" variant="outline" onClick={() => append({ accountId: "", debit: 0, credit: 0, description: "" })}>
                        <Plus className="mr-2 h-4 w-4" /> Add Line
                    </Button>
                </div>
            </CardContent>
        </Card>
      </form>
    </Form>
  );
}
