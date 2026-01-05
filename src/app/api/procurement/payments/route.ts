import { db } from "@/db";
import { supplierPayments, supplierPaymentAllocations, purchaseInvoices } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCompanyId } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payments = await db.query.supplierPayments.findMany({
      where: eq(supplierPayments.companyId, companyId),
      orderBy: [desc(supplierPayments.paymentDate)],
      with: {
        supplier: true,
        allocations: true,
      },
    });

    return NextResponse.json({ success: true, data: payments });
  } catch (error: any) {
    console.error("[GET /api/procurement/payments]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { 
      supplierId, 
      paymentDate, 
      paymentMethod, 
      amount, 
      bankName, 
      chequeNumber, 
      chequeDate, 
      reference, 
      notes,
      allocations 
    } = body;

    if (!supplierId || !paymentDate || !paymentMethod || !amount) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const result = await db.transaction(async (tx) => {
      const paymentNumber = `PAY-${Date.now()}`;
      
      const totalAllocated = allocations 
        ? allocations.reduce((sum: number, a: any) => sum + Number(a.amount), 0)
        : 0;

      const [payment] = await tx.insert(supplierPayments).values({
        companyId,
        supplierId,
        paymentNumber,
        paymentDate,
        paymentMethod,
        amount: amount.toString(),
        bankName,
        chequeNumber,
        chequeDate,
        reference,
        notes,
        allocatedAmount: totalAllocated.toFixed(2),
        unallocatedAmount: (Number(amount) - totalAllocated).toFixed(2),
        status: "draft",
      }).returning();

      // Create allocations and update invoice balances
      if (allocations && allocations.length > 0) {
        for (const allocation of allocations) {
          await tx.insert(supplierPaymentAllocations).values({
            companyId,
            paymentId: payment.id,
            invoiceId: allocation.invoiceId,
            allocatedAmount: allocation.amount.toString(),
            allocationDate: paymentDate,
          });

          // Get current invoice
          const [invoice] = await tx
            .select()
            .from(purchaseInvoices)
            .where(eq(purchaseInvoices.id, allocation.invoiceId));

          if (invoice) {
            const newPaid = Number(invoice.paidAmount || 0) + Number(allocation.amount);
            const newBalance = Number(invoice.totalAmount) - newPaid;

            await tx
              .update(purchaseInvoices)
              .set({
                paidAmount: newPaid.toFixed(2),
                balanceAmount: newBalance.toFixed(2),
                lastPaymentDate: new Date(),
              })
              .where(eq(purchaseInvoices.id, allocation.invoiceId));
          }
        }
      }

      return { payment };
    });

    return NextResponse.json({ 
      success: true, 
      message: "Payment created",
      data: result.payment 
    });
  } catch (error: any) {
    console.error("[POST /api/procurement/payments]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
