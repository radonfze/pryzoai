"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import SalesOrderForm from "../../new/sales-order-form"; // Assuming form is here or shared
import { getSalesOrderById } from "@/actions/sales/create-sales-order"; // Need to create/verify this action
import { Loader2 } from "lucide-react";

export default function EditSalesOrderPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Need a fetcher. Let's assume we can fetch data.
      // Since we don't have a dedicated fetch-for-edit action yet, we might need to create it 
      // or use a direct server action if we switch this to a server component?
      // Actually, form is client. Let's fetch in useEffect.
      try {
        const res = await fetch(`/api/sales/orders/${id}`); // Or action
        // Direct DB access better via server action
      } catch (e) {
         console.error(e);
      }
      setLoading(false);
    }
  }, [id]);

  if (loading) return <Loader2 className="h-8 w-8 animate-spin" />;

  return (
    <SalesOrderForm initialData={data} isEdit={true} />
  );
}
