"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { GradientHeader } from "@/components/ui/gradient-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, CheckCircle, ArrowRight, ArrowLeft, Search, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Customer {
  id: string;
  name: string;
  code: string;
  city?: string;
  outstandingBalance?: string;
}

interface SalesOrder {
  id: string;
  orderNumber: string;
  orderDate: string;
  totalAmount: string;
  status: string;
}

export default function InvoiceWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // Load customers on mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Load orders when customer changes
  useEffect(() => {
    if (selectedCustomer) {
      fetchOrders(selectedCustomer.id);
    }
  }, [selectedCustomer]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/customers?limit=50");
      const data = await res.json();
      setCustomers(data.customers || data || []);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (customerId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sales/orders?customerId=${customerId}&status=issued`);
      const data = await res.json();
      setOrders(data.orders || data || []);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else {
      // Final submit - redirect to invoice form with params
      const params = new URLSearchParams();
      if (selectedCustomer) params.set("customerId", selectedCustomer.id);
      if (selectedOrders.length > 0) params.set("orders", selectedOrders.join(","));
      router.push(`/sales/invoices/new?${params.toString()}`);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOrdersTotal = orders
    .filter(o => selectedOrders.includes(o.id))
    .reduce((sum, o) => sum + Number(o.totalAmount), 0);

  return (
    <div className="space-y-6 p-6">
      <GradientHeader
        module="sales"
        title="Invoice Wizard"
        description="Create invoices step-by-step or merge sales orders"
        icon="Wand2"
        backUrl="/sales/invoices"
      />

      {/* Step Indicator */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center space-x-4">
          <StepIndicator number={1} title="Customer" active={step >= 1} current={step === 1} />
          <div className={`w-16 h-1 ${step > 1 ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`} />
          <StepIndicator number={2} title="Source" active={step >= 2} current={step === 2} />
          <div className={`w-16 h-1 ${step > 2 ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`} />
          <StepIndicator number={3} title="Review" active={step >= 3} current={step === 3} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && "Select Customer"}
              {step === 2 && "Select Source Documents"}
              {step === 3 && "Review & Create"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Who is this invoice for?"}
              {step === 2 && "Choose pending sales orders to merge or start blank."}
              {step === 3 && "Confirm details before generating draft."}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="min-h-[400px]">
            {/* Step 1: Customer Selection */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search customers..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                    {filteredCustomers.map((customer) => (
                      <button 
                        key={customer.id}
                        onClick={() => setSelectedCustomer(customer)}
                        className={`p-4 border rounded-lg text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                          selectedCustomer?.id === customer.id 
                            ? 'border-primary ring-2 ring-primary/20 bg-primary/5' 
                            : ''
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-sm text-muted-foreground">{customer.code}</div>
                          </div>
                          {customer.outstandingBalance && Number(customer.outstandingBalance) > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {Number(customer.outstandingBalance).toFixed(0)} Due
                            </Badge>
                          )}
                        </div>
                        {customer.city && (
                          <div className="text-xs text-muted-foreground mt-1">{customer.city}</div>
                        )}
                      </button>
                    ))}
                    {filteredCustomers.length === 0 && (
                      <div className="col-span-2 text-center py-8 text-muted-foreground">
                        No customers found
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Order Selection */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Pending orders for <strong>{selectedCustomer?.name}</strong>
                  </p>
                  {selectedOrders.length > 0 && (
                    <Badge variant="secondary">
                      {selectedOrders.length} selected = {selectedOrdersTotal.toFixed(2)} AED
                    </Badge>
                  )}
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : orders.length > 0 ? (
                  <div className="space-y-2">
                    {orders.map((order) => (
                      <label 
                        key={order.id} 
                        className={`flex items-center space-x-3 border p-4 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 ${
                          selectedOrders.includes(order.id) ? 'border-primary bg-primary/5' : ''
                        }`}
                      >
                        <input 
                          type="checkbox" 
                          className="h-4 w-4 rounded"
                          checked={selectedOrders.includes(order.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedOrders([...selectedOrders, order.id]);
                            } else {
                              setSelectedOrders(selectedOrders.filter(x => x !== order.id));
                            }
                          }}
                        />
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span className="font-semibold">{order.orderNumber}</span>
                            <span className="font-medium">{Number(order.totalAmount).toFixed(2)} AED</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {order.orderDate}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-lg bg-muted/20">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground">No pending orders found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      You can still create a blank invoice
                    </p>
                  </div>
                )}

                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium">Want to start fresh?</p>
                  <Button variant="link" className="p-0 h-auto" onClick={() => setSelectedOrders([])}>
                    Skip order selection and create blank invoice
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="flex flex-col items-center justify-center h-full py-12">
                <CheckCircle className="h-20 w-20 text-green-500 mb-6" />
                <h3 className="text-2xl font-semibold mb-2">Ready to Generate</h3>
                <p className="text-center text-muted-foreground max-w-md mb-6">
                  We will create a draft invoice for <strong>{selectedCustomer?.name}</strong>
                  {selectedOrders.length > 0 
                    ? ` by merging ${selectedOrders.length} order(s) totaling ${selectedOrdersTotal.toFixed(2)} AED.` 
                    : " with no initial items."}
                </p>
                
                <div className="w-full max-w-sm space-y-2 text-sm">
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span>Customer</span>
                    <span className="font-medium">{selectedCustomer?.name}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span>Orders to merge</span>
                    <span className="font-medium">{selectedOrders.length}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span>Estimated total</span>
                    <span className="font-medium">{selectedOrdersTotal.toFixed(2)} AED</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between border-t pt-6">
            <Button variant="ghost" onClick={handleBack} disabled={step === 1}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <Button onClick={handleNext} disabled={step === 1 && !selectedCustomer}>
              {step === 3 ? "Create Draft Invoice" : "Next"} 
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

function StepIndicator({ number, title, active, current }: { number: number, title: string, active: boolean, current: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`
        flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm
        ${current ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' : 
          active ? 'bg-primary text-primary-foreground' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}
      `}>
        {active && !current ? <CheckCircle className="h-5 w-5" /> : number}
      </div>
      <span className={`text-xs font-medium ${current ? 'text-primary' : 'text-muted-foreground'}`}>
        {title}
      </span>
    </div>
  );
}
