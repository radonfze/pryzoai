"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Package, Lock, Warehouse, Clock, FileText, ExternalLink } from "lucide-react";
import Link from "next/link";

interface DrillThroughDialogProps {
  itemId: string;
  itemCode: string;
  itemName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: "stock" | "reservations" | "transactions";
}

interface StockByWarehouse {
  warehouseId: string;
  warehouseName: string;
  onHand: number;
  reserved: number;
  available: number;
}

interface Reservation {
  id: string;
  documentType: string;
  documentNumber: string;
  quantityReserved: number;
  quantityFulfilled: number;
  status: string;
  expiresAt: Date | null;
  project?: { name: string } | null;
  customer?: { name: string } | null;
}

interface Transaction {
  id: string;
  transactionDate: Date;
  transactionType: string;
  quantityChange: number;
  documentNumber: string;
  warehouse?: { name: string } | null;
}

export function ItemDrillThroughDialog({
  itemId,
  itemCode,
  itemName,
  open,
  onOpenChange,
  initialTab = "stock",
}: DrillThroughDialogProps) {
  const [loading, setLoading] = useState(true);
  const [stockData, setStockData] = useState<StockByWarehouse[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (open && itemId) {
      fetchData();
    }
  }, [open, itemId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/inventory/items/${itemId}/drill-through`);
      if (response.ok) {
        const data = await response.json();
        setStockData(data.stockByWarehouse || []);
        setReservations(data.reservations || []);
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error("Failed to fetch drill-through data:", error);
    }
    setLoading(false);
  };

  const totalOnHand = stockData.reduce((sum, s) => sum + s.onHand, 0);
  const totalReserved = stockData.reduce((sum, s) => sum + s.reserved, 0);
  const totalAvailable = stockData.reduce((sum, s) => sum + s.available, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            <span>{itemName}</span>
            <Badge variant="outline" className="font-mono ml-2">{itemCode}</Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={initialTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="stock" className="gap-1">
              <Warehouse className="h-4 w-4" /> Stock
            </TabsTrigger>
            <TabsTrigger value="reservations" className="gap-1">
              <Lock className="h-4 w-4" /> Reservations
            </TabsTrigger>
            <TabsTrigger value="transactions" className="gap-1">
              <FileText className="h-4 w-4" /> Transactions
            </TabsTrigger>
          </TabsList>

          {/* Stock by Warehouse */}
          <TabsContent value="stock" className="flex-1 overflow-auto mt-4">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm text-muted-foreground">Total On Hand</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <p className="text-2xl font-bold tabular-nums">{totalOnHand}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm text-muted-foreground">Total Reserved</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <p className="text-2xl font-bold tabular-nums text-blue-600">{totalReserved}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm text-muted-foreground">Total Available</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <p className={`text-2xl font-bold tabular-nums ${totalAvailable <= 0 ? "text-red-600" : "text-green-600"}`}>
                    {totalAvailable}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">By Warehouse</h4>
              {loading ? (
                <p className="text-muted-foreground text-sm py-4 text-center">Loading...</p>
              ) : stockData.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">No stock in any warehouse</p>
              ) : (
                stockData.map((wh) => (
                  <div key={wh.warehouseId} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">{wh.warehouseName}</span>
                    <div className="flex gap-6 text-sm">
                      <div>
                        <span className="text-muted-foreground">On Hand:</span>{" "}
                        <span className="font-medium tabular-nums">{wh.onHand}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Reserved:</span>{" "}
                        <span className="font-medium tabular-nums text-blue-600">{wh.reserved}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Available:</span>{" "}
                        <span className={`font-medium tabular-nums ${wh.available <= 0 ? "text-red-600" : "text-green-600"}`}>
                          {wh.available}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Reservations */}
          <TabsContent value="reservations" className="flex-1 overflow-auto mt-4">
            {loading ? (
              <p className="text-muted-foreground text-sm py-4 text-center">Loading...</p>
            ) : reservations.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">No active reservations</p>
            ) : (
              <div className="space-y-2">
                {reservations.map((res) => (
                  <div key={res.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{res.documentType}</span>
                        <span className="font-medium">{res.documentNumber || "—"}</span>
                        <Badge variant={res.status === "active" ? "default" : "secondary"} className="text-xs">
                          {res.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {res.project?.name && <span>Project: {res.project.name} • </span>}
                        {res.customer?.name && <span>Customer: {res.customer.name}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium tabular-nums">
                        {res.quantityFulfilled || 0} / {res.quantityReserved}
                      </div>
                      {res.expiresAt && (
                        <div className="text-xs text-muted-foreground">
                          Expires: {formatDate(res.expiresAt)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Recent Transactions */}
          <TabsContent value="transactions" className="flex-1 overflow-auto mt-4">
            {loading ? (
              <p className="text-muted-foreground text-sm py-4 text-center">Loading...</p>
            ) : transactions.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">No recent transactions</p>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">{tx.documentNumber}</span>
                        <Badge variant="outline" className="text-xs capitalize">
                          {tx.transactionType.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {tx.warehouse?.name || "—"} • {formatDate(tx.transactionDate)}
                      </div>
                    </div>
                    <div className={`font-medium tabular-nums ${tx.quantityChange > 0 ? "text-green-600" : "text-red-600"}`}>
                      {tx.quantityChange > 0 ? "+" : ""}{tx.quantityChange}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Link href={`/inventory/items/${itemId}`}>
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 h-4 w-4" /> View Full Details
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
