"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";

const defaultTerms = [
  { id: "1", name: "Net 30", days: 30, description: "Payment due within 30 days", isDefault: true },
  { id: "2", name: "Net 15", days: 15, description: "Payment due within 15 days", isDefault: false },
  { id: "3", name: "Net 60", days: 60, description: "Payment due within 60 days", isDefault: false },
  { id: "4", name: "Due on Receipt", days: 0, description: "Payment due immediately", isDefault: false },
  { id: "5", name: "Net 7", days: 7, description: "Payment due within 7 days", isDefault: false },
];

export default function PaymentTermsPage() {
  const [terms, setTerms] = useState(defaultTerms);
  const [newTerm, setNewTerm] = useState({ name: "", days: 30, description: "" });
  const [showAdd, setShowAdd] = useState(false);

  const handleAdd = () => {
    if (newTerm.name) {
      setTerms([...terms, { ...newTerm, id: Date.now().toString(), isDefault: false }]);
      setNewTerm({ name: "", days: 30, description: "" });
      setShowAdd(false);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Payment Terms</h2>
          <p className="text-muted-foreground mt-1">Configure payment terms for customers and suppliers</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Term
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Terms List</CardTitle>
          <CardDescription>Define payment due dates for invoices and bills</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Default</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {terms.map((term) => (
                <TableRow key={term.id}>
                  <TableCell className="font-medium">{term.name}</TableCell>
                  <TableCell>{term.days}</TableCell>
                  <TableCell className="text-muted-foreground">{term.description}</TableCell>
                  <TableCell>
                    {term.isDefault && <Badge>Default</Badge>}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {showAdd && (
                <TableRow>
                  <TableCell>
                    <Input 
                      placeholder="Term name" 
                      value={newTerm.name}
                      onChange={(e) => setNewTerm({...newTerm, name: e.target.value})}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number"
                      value={newTerm.days}
                      onChange={(e) => setNewTerm({...newTerm, days: parseInt(e.target.value)})}
                      className="h-8 w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      placeholder="Description" 
                      value={newTerm.description}
                      onChange={(e) => setNewTerm({...newTerm, description: e.target.value})}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" onClick={handleAdd}>Add</Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
