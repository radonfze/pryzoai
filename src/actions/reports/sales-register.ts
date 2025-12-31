"use server";

import { db } from "@/db";
import { salesInvoices, customers } from "@/db/schema";
import { and, eq, gte, lte, desc, sql } from "drizzle-orm";
import { getCompanyId } from "@/lib/auth";

export interface SalesRegisterParams {
  startDate?: string;
  endDate?: string;
  status?: string;
}

export async function getSalesRegister(params: SalesRegisterParams) {
  const companyId = await getCompanyId();
  if (!companyId) return { data: [], totals: {} };

  const conditions = [eq(salesInvoices.companyId, companyId)];
  
  if (params.startDate) {
    conditions.push(gte(salesInvoices.invoiceDate, params.startDate));
  }
  if (params.endDate) {
    conditions.push(lte(salesInvoices.invoiceDate, params.endDate));
  }
  if (params.status && params.status !== "all") {
    // If status is 'posted', we check isPosted flag, or status enum?
    // Let's use status enum for now, or isPosted if specific 'posted' string passed
    if (params.status === 'posted_only') {
         conditions.push(eq(salesInvoices.isPosted, true));
    } else {
         conditions.push(eq(salesInvoices.status, params.status as any));
    }
  }

  const data = await db.query.salesInvoices.findMany({
    where: and(...conditions),
    with: {
      customer: true
    },
    orderBy: [desc(salesInvoices.invoiceDate)]
  });

  // Calculate Aggregates
  const totals = data.reduce((acc, curr) => ({
      totalAmount: acc.totalAmount + Number(curr.totalAmount || 0),
      taxAmount: acc.taxAmount + Number(curr.taxAmount || 0),
      subtotal: acc.subtotal + Number(curr.subtotal || 0),
  }), { totalAmount: 0, taxAmount: 0, subtotal: 0 });

  return { data, totals };
}
