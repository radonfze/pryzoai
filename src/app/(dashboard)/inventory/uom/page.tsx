import { GradientHeader } from "@/components/ui/gradient-header";
import { Scale, Plus, Pencil, Trash2, MoreHorizontal, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getUoms } from "@/actions/inventory/uom";

export default async function UOMListPage() {
  const uoms = await getUoms();

  return (
    <div className="space-y-6">
      <GradientHeader
        module="inventory"
        title="Units of Measure"
        description="Manage units of measure and conversion factors"
        icon={Scale}
      >
        <Link href="/inventory/uom/new">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New UOM
          </Button>
        </Link>
      </GradientHeader>
      
      <Card>
        <CardContent className="pt-6">
          {uoms.length === 0 ? (
            <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
              <Scale className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No Units of Measure</p>
              <p className="text-sm">Create your first UOM to get started</p>
              <Link href="/inventory/uom/new" className="mt-4">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create UOM
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uoms.map((uom) => (
                  <TableRow key={uom.id}>
                    <TableCell className="font-medium">{uom.code}</TableCell>
                    <TableCell>{uom.name}</TableCell>
                    <TableCell>
                      <Badge variant={uom.isActive ? "default" : "secondary"}>
                        {uom.isActive ? (
                          <><Check className="h-3 w-3 mr-1" /> Active</>
                        ) : (
                          <><X className="h-3 w-3 mr-1" /> Inactive</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/inventory/uom/${uom.id}/edit`}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
