"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GradientHeader } from "@/components/ui/gradient-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

// Step components would ideally be separate, but for brevity we'll inline logic or use placeholders
// Phase 4: Wizard Logic placeholder

export default function InvoiceWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else {
      // Final submit - redirect to standard invoice form with params
      // In real implementation, this would pass data via context or URL params
      router.push(`/sales/invoices/new?customerId=${selectedCustomer}&orders=${selectedOrders.join(',')}`);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="space-y-6">
      <GradientHeader
        module="sales"
        title="Invoice Wizard"
        description="Create invoices step-by-step or merge sales orders"
        icon="Wand2"
        backUrl="/sales/invoices"
      />

      <div className="flex justify-center mb-8">
        <div className="flex items-center space-x-4">
          <StepIndicator number={1} title="Customer" active={step >= 1} current={step === 1} />
          <div className="w-16 h-1 bg-gray-200 dark:bg-gray-700" />
          <StepIndicator number={2} title="Source" active={step >= 2} current={step === 2} />
          <div className="w-16 h-1 bg-gray-200 dark:bg-gray-700" />
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
          
          <CardContent className="min-h-[300px]">
            {step === 1 && (
                <div className="flex flex-col gap-4">
                    <p className="text-sm text-gray-500">Pick a customer to fetch their pending orders.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Mock Customer List */}
                        {[1, 2, 3].map((i) => (
                            <button 
                                key={i}
                                onClick={() => setSelectedCustomer(`run-cust-${i}`)}
                                className={`p-4 border rounded-lg text-left hover:bg-slate-50 transition-colors ${selectedCustomer === `run-cust-${i}` ? 'border-primary ring-1 ring-primary' : ''}`}
                            >
                                <div className="font-medium">Customer {i} LLC</div>
                                <div className="text-sm text-gray-500">Dubai, UAE</div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="flex flex-col gap-4">
                     <p className="text-sm text-gray-500">Found 3 pending Sales Orders for Customer {selectedCustomer}</p>
                     <div className="space-y-2">
                        {/* Mock Orders */}
                        {['SO-2025-001', 'SO-2025-002', 'SO-2025-005'].map((so) => (
                             <div key={so} className="flex items-center space-x-2 border p-3 rounded">
                                <input 
                                    type="checkbox" 
                                    id={so} 
                                    className="h-4 w-4"
                                    onChange={(e) => {
                                        if(e.target.checked) setSelectedOrders([...selectedOrders, so]);
                                        else setSelectedOrders(selectedOrders.filter(x => x !== so));
                                    }}
                                />
                                <label htmlFor={so} className="flex-1 cursor-pointer">
                                    <span className="font-semibold">{so}</span>
                                    <span className="mx-2 text-gray-400">|</span>
                                    <span>AED 1,250.00</span>
                                </label>
                             </div>
                        ))}
                     </div>
                     <div className="mt-4 p-4 bg-muted rounded">
                        <p className="text-sm font-medium">Or start with a blank invoice?</p>
                        <Button variant="link" onClick={() => setSelectedOrders([])}>Skip merging orders</Button>
                     </div>
                </div>
            )}

            {step === 3 && (
                <div className="flex flex-col gap-4 items-center justify-center h-full pt-10">
                    <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                    <h3 className="text-xl font-semibold">Ready to Generate</h3>
                    <p className="text-center text-gray-500 max-w-md">
                        We will create a draft invoice for <strong>Customer {selectedCustomer}</strong>
                        {selectedOrders.length > 0 ? ` merging ${selectedOrders.length} orders.` : " with no initial items."}
                    </p>
                </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button variant="ghost" onClick={handleBack} disabled={step === 1}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <Button onClick={handleNext} disabled={step === 1 && !selectedCustomer}>
                {step === 3 ? "Create Draft Invoice" : "Next"} <ArrowRight className="h-4 w-4 ml-2" />
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
                flex items-center justify-center w-8 h-8 rounded-full font-bold
                ${current ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' : 
                  active ? 'bg-primary text-primary-foreground' : 'bg-gray-200 text-gray-400'}
            `}>
                {active && !current ? <CheckCircle className="h-5 w-5" /> : number}
            </div>
            <span className={`text-xs font-medium ${current ? 'text-primary' : 'text-gray-500'}`}>{title}</span>
        </div>
    )
}
