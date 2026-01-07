import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { stockLedger, inventoryReservations, stockTransactions, warehouses } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getCompanyId } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: itemId } = await params;

    // 1. Stock by Warehouse
    const stockData = await db.query.stockLedger.findMany({
      where: and(
        eq(stockLedger.companyId, companyId),
        eq(stockLedger.itemId, itemId)
      ),
      with: {
        warehouse: true,
      },
    });

    const stockByWarehouse = stockData.map((s) => ({
      warehouseId: s.warehouseId,
      warehouseName: s.warehouse?.name || "Unknown",
      onHand: parseFloat(s.quantityOnHand || "0"),
      reserved: parseFloat(s.quantityReserved || "0"),
      available: parseFloat(s.quantityAvailable || "0"),
    }));

    // 2. Reservations
    const reservationsData = await db.query.inventoryReservations.findMany({
      where: and(
        eq(inventoryReservations.companyId, companyId),
        eq(inventoryReservations.itemId, itemId)
      ),
      with: {
        project: true,
        customer: true,
      },
      orderBy: [desc(inventoryReservations.createdAt)],
      limit: 20,
    });

    const reservations = reservationsData.map((r) => ({
      id: r.id,
      documentType: r.documentType,
      documentNumber: r.documentNumber,
      quantityReserved: parseFloat(r.quantityReserved || "0"),
      quantityFulfilled: parseFloat(r.quantityFulfilled || "0"),
      status: r.status,
      expiresAt: r.expiresAt,
      project: r.project ? { name: r.project.name } : null,
      customer: r.customer ? { name: r.customer.name } : null,
    }));

    // 3. Recent Transactions
    const transactionsData = await db.query.stockTransactions.findMany({
      where: and(
        eq(stockTransactions.companyId, companyId),
        eq(stockTransactions.itemId, itemId)
      ),
      with: {
        warehouse: true,
      },
      orderBy: [desc(stockTransactions.transactionDate)],
      limit: 20,
    });

    const transactions = transactionsData.map((t) => ({
      id: t.id,
      transactionDate: t.transactionDate,
      transactionType: t.transactionType,
      quantityChange: parseFloat(t.quantityChange || "0"),
      documentNumber: t.documentNumber,
      warehouse: t.warehouse ? { name: t.warehouse.name } : null,
    }));

    return NextResponse.json({
      stockByWarehouse,
      reservations,
      transactions,
    });
  } catch (error: any) {
    console.error("Drill-through API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
