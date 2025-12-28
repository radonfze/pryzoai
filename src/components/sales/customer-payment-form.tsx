"use client";

import { useForm, useFieldArray } from "react-hook-form";
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
import { Plus, Trash, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const formSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  invoiceIds: z.array(z.string()).min(1, "Select at least one invoice"),
  paymentDate: z.string().min(1, "Date is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof formSchema>;

interface CustomerPaymentFormProps {
  customers: any[];
  openInvoices: any[];
}

export function CustomerPaymentForm({ customers, openInvoices }: CustomerPaymentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: "bank_transfer",
      invoiceIds: [],
    },
  });

  const filteredInvoices = openInvoices.filter(inv => inv.customerId === selectedCustomerId);
  const selectedInvoices = form.watch("invoiceIds");
  const totalSelected = filteredInvoices
    .filter(inv => selectedInvoices.includes(inv.id))
    .reduce((sum, inv) => sum + Number(inv.balanceAmount || 0), 0);

  const onSubmit = async (data: PaymentFormValues) => {
    setLoading(true);
    try {
      console.log("Submitting payment:", data);
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Payment recorded successfully");
      router.push("/sales/payments");
    } catch (error) {
      toast.error("Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer *</FormLabel>
                    <Select onValueChange={(val) => {
                      field.onChange(val);
                      setSelectedCustomerId(val);
                      form.setValue("invoiceIds", []);
                    }} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference</FormLabel>
                    <FormControl>
                      <Input placeholder="Cheque #, Transaction ID..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Open Invoices</h3>
              {filteredInvoices.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  {selectedCustomerId ? "No open invoices for this customer" : "Select a customer first"}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredInvoices.map((inv) => (
                    <label key={inv.id} className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-muted/50">
                      <input
                        type="checkbox"
                        checked={selectedInvoices.includes(inv.id)}
                        onChange={(e) => {
                          const current = form.getValues("invoiceIds");
                          if (e.target.checked) {
                            form.setValue("invoiceIds", [...current, inv.id]);
                          } else {
                            form.setValue("invoiceIds", current.filter((id: string) => id !== inv.id));
                          }
                        }}
                        className="h-4 w-4"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{inv.invoiceNumber}</div>
                        <div className="text-sm text-muted-foreground">
                          Due: {new Date(inv.dueDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{Number(inv.balanceAmount).toLocaleString()} AED</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              <div className="mt-4 pt-4 border-t flex justify-between font-medium">
                <span>Total Selected</span>
                <span>{totalSelected.toLocaleString()} AED</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Record Payment
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
