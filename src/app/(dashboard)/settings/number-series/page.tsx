"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Save, Settings2 } from "lucide-react";

// Define all series types with their defaults
const seriesDefinitions = {
  masters: {
    title: "Masters",
    description: "Customer, Supplier, Employee, Item codes",
    items: [
      { code: "CUST", name: "Customer", prefix: "CUS", separator: "-", digits: 5, yearFormat: "none", example: "CUS-00001" },
      { code: "SUPP", name: "Supplier", prefix: "SUP", separator: "-", digits: 5, yearFormat: "none", example: "SUP-00001" },
      { code: "ITEM", name: "Item/SKU", prefix: "SKU", separator: "-", digits: 5, yearFormat: "none", example: "SKU-00001" },
      { code: "EMP", name: "Employee", prefix: "EMP", separator: "-", digits: 5, yearFormat: "none", example: "EMP-00001" },
    ],
  },
  structure: {
    title: "Structure",
    description: "Company, Branch, Warehouse, GL Account codes",
    items: [
      { code: "CMP", name: "Company", prefix: "CMP", separator: "-", digits: 4, yearFormat: "none", example: "CMP-0001" },
      { code: "BR", name: "Branch", prefix: "BR", separator: "-", digits: 4, yearFormat: "none", example: "BR-0001" },
      { code: "WH", name: "Warehouse", prefix: "WH", separator: "-", digits: 4, yearFormat: "none", example: "WH-0001" },
    ],
  },
  sales: {
    title: "Sales",
    description: "Quotation, Sales Order, Invoice, Receipt numbers",
    items: [
      { code: "QT", name: "Quotation", prefix: "QT", separator: "-", digits: 5, yearFormat: "yyyy", example: "QT-2025-00001" },
      { code: "SO", name: "Sales Order", prefix: "SO", separator: "-", digits: 5, yearFormat: "yyyy", example: "SO-2025-00001" },
      { code: "INV", name: "Invoice", prefix: "INV", separator: "-", digits: 5, yearFormat: "yyyy", example: "INV-2025-00001" },
      { code: "SR", name: "Sales Return", prefix: "SR", separator: "-", digits: 5, yearFormat: "yyyy", example: "SR-2025-00001" },
      { code: "REC", name: "Receipt", prefix: "REC", separator: "-", digits: 5, yearFormat: "yyyy", example: "REC-2025-00001" },
    ],
  },
  purchase: {
    title: "Purchase",
    description: "Purchase Request, PO, GRN, Bill numbers",
    items: [
      { code: "PR", name: "Purchase Request", prefix: "PR", separator: "-", digits: 5, yearFormat: "yyyy", example: "PR-2025-00001" },
      { code: "PO", name: "Purchase Order", prefix: "PO", separator: "-", digits: 5, yearFormat: "yyyy", example: "PO-2025-00001" },
      { code: "GRN", name: "Goods Receipt", prefix: "GRN", separator: "-", digits: 5, yearFormat: "yyyy", example: "GRN-2025-00001" },
      { code: "BILL", name: "Purchase Bill", prefix: "BILL", separator: "-", digits: 5, yearFormat: "yyyy", example: "BILL-2025-00001" },
      { code: "RTN", name: "Purchase Return", prefix: "RTN", separator: "-", digits: 5, yearFormat: "yyyy", example: "RTN-2025-00001" },
    ],
  },
  finance: {
    title: "Finance",
    description: "Journal, Payment, Asset numbers",
    items: [
      { code: "JV", name: "Journal Voucher", prefix: "JV", separator: "-", digits: 5, yearFormat: "yyyy", example: "JV-2025-00001" },
      { code: "PAY", name: "Payment", prefix: "PAY", separator: "-", digits: 5, yearFormat: "yyyy", example: "PAY-2025-00001" },
      { code: "PDC", name: "Post-Dated Check", prefix: "PDC", separator: "-", digits: 5, yearFormat: "yyyy", example: "PDC-2025-00001" },
      { code: "FA", name: "Fixed Asset", prefix: "FA", separator: "-", digits: 5, yearFormat: "none", example: "FA-00001" },
    ],
  },
};

type SeriesItem = {
  code: string;
  name: string;
  prefix: string;
  separator: string;
  digits: number;
  yearFormat: string;
  example: string;
  currentNumber?: number;
  isActive?: boolean;
};

export default function NumberSeriesPage() {
  const [saving, setSaving] = useState(false);
  // Initialize state from static definitions
  const [seriesData, setSeriesData] = useState(seriesDefinitions);

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // TODO: Save all series to database
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate save
      alert("Number series settings saved!");
    } finally {
      setSaving(false);
    }
  };

  const updateSeriesItem = (categoryKey: keyof typeof seriesDefinitions, itemCode: string, field: keyof SeriesItem, value: any) => {
    setSeriesData(prev => {
      const newData = { ...prev };
      const category = newData[categoryKey];
      const items = category.items.map(item => {
        if (item.code === itemCode) {
          return { ...item, [field]: value };
        }
        return item;
      });
      newData[categoryKey] = { ...category, items };
      return newData;
    });
  };

  const previewNumber = (item: SeriesItem) => {
    let result = item.prefix;
    if (item.yearFormat === "yyyy") {
      result += item.separator + new Date().getFullYear();
    } else if (item.yearFormat === "yy") {
      result += item.separator + String(new Date().getFullYear()).slice(-2);
    }
    result += item.separator + "0".repeat(Number(item.digits) - 1) + "1";
    return result;
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Number Series</h2>
          <p className="text-muted-foreground mt-1">Configure auto-numbering for all documents and master records</p>
        </div>
        <Button onClick={handleSaveAll} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save All"}
        </Button>
      </div>

      {(Object.entries(seriesData) as [keyof typeof seriesDefinitions, typeof seriesDefinitions['masters']][]).map(([key, category]) => (
        <Card key={key}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              <CardTitle>{category.title}</CardTitle>
            </div>
            <CardDescription>{category.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Document</TableHead>
                  <TableHead className="w-[100px]">Prefix</TableHead>
                  <TableHead className="w-[80px]">Separator</TableHead>
                  <TableHead className="w-[80px]">Digits</TableHead>
                  <TableHead className="w-[120px]">Year Format</TableHead>
                  <TableHead>Preview</TableHead>
                  <TableHead className="w-[100px]">Current #</TableHead>
                  <TableHead className="w-[80px]">Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {category.items.map((item) => (
                  <TableRow key={item.code}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Input 
                        value={item.prefix}
                        onChange={(e) => updateSeriesItem(key, item.code, 'prefix', e.target.value)}
                        className="h-8 w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={item.separator} 
                        onValueChange={(val) => updateSeriesItem(key, item.code, 'separator', val)}
                      >
                        <SelectTrigger className="h-8 w-16">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="-">-</SelectItem>
                          <SelectItem value="/">/ </SelectItem>
                          <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={String(item.digits)}
                        onValueChange={(val) => updateSeriesItem(key, item.code, 'digits', Number(val))}
                      >
                        <SelectTrigger className="h-8 w-16">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="4">4</SelectItem>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="6">6</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={item.yearFormat}
                        onValueChange={(val) => updateSeriesItem(key, item.code, 'yearFormat', val)}
                      >
                        <SelectTrigger className="h-8 w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="yy">YY</SelectItem>
                          <SelectItem value="yyyy">YYYY</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {previewNumber(item)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number"
                        value={item.currentNumber || 0}
                        onChange={(e) => updateSeriesItem(key, item.code, 'currentNumber', Number(e.target.value))}
                        className="h-8 w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Switch 
                        checked={item.isActive !== false}
                        onCheckedChange={(val) => updateSeriesItem(key, item.code, 'isActive', val)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      <div className="rounded-md border p-4 bg-muted/30">
        <h3 className="font-semibold mb-2">How Number Series Work</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>Prefix</strong>: The text before the number (e.g., INV, PO, CUST)</li>
          <li>• <strong>Separator</strong>: Character between parts (dash, slash, or none)</li>
          <li>• <strong>Digits</strong>: Number of digits with leading zeros (5 digits = 00001)</li>
          <li>• <strong>Year Format</strong>: Include year in the number (for documents) or none (for masters)</li>
          <li>• <strong>Current #</strong>: The last used number in this series</li>
        </ul>
      </div>
    </div>
  );
}
