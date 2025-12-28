"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateGlMapping } from "@/actions/settings/gl-mapping";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function GlMappingForm({ initialMappings, accounts }: any) {
    const [loading, setLoading] = useState(false);
    
    // Transform array to object
    const defaults = initialMappings.reduce((acc: any, curr: any) => {
        acc[curr.mappingKey] = curr.accountId;
        return acc;
    }, {});

    const [values, setValues] = useState(defaults);

    const keys = [
        { key: "DEFAULT_SALES", label: "Default Sales (Income)" },
        { key: "DEFAULT_COGS", label: "Cost of Goods Sold (Expense)" },
        { key: "DEFAULT_INVENTORY", label: "Inventory Asset" },
        { key: "DEFAULT_CASH", label: "Default Cash Account" },
        { key: "DEFAULT_BANK", label: "Default Bank Account" },
        { key: "VAT_PAYABLE", label: "VAT Payable (Liability)" },
        { key: "VAT_RECEIVABLE", label: "VAT Receivable (Asset)" },
        { key: "RETAINED_EARNINGS", label: "Retained Earnings" },
        { key: "PAYROLL_PAYABLE", label: "Payroll Payable" },
        { key: "EXPENSE_ACCOUNT", label: "General Expense Account" },
    ];

    async function onSubmit(e: any) {
        e.preventDefault();
        setLoading(true);
        const res = await updateGlMapping(values);
        setLoading(false);
        if (res.success) toast.success("Mappings Saved");
        else toast.error(res.message);
    }

    return (
        <form onSubmit={onSubmit} className="space-y-6 max-w-2xl bg-white p-6 rounded border">
             {keys.map((k) => (
                 <div key={k.key} className="grid grid-cols-3 items-center gap-4">
                     <Label className="col-span-1">{k.label}</Label>
                     <div className="col-span-2">
                        <Select 
                            value={values[k.key] || ""} 
                            onValueChange={(val) => setValues({...values, [k.key]: val})}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Account" />
                            </SelectTrigger>
                            <SelectContent>
                                {accounts.map((a: any) => (
                                    <SelectItem key={a.id} value={a.id}>
                                        {a.code} - {a.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                     </div>
                 </div>
             ))}
             <Button type="submit" disabled={loading}>Save Mappings</Button>
        </form>
    );
}
