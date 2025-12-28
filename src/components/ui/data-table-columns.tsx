"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Copy,
  Printer,
  Mail,
  XCircle,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";

// Action column configuration
interface ActionConfig<T> {
  basePath: string;
  onDelete?: (id: string) => void;
  onDuplicate?: (item: T) => void;
  onPrint?: (id: string) => void;
  onEmail?: (id: string) => void;
  onVoid?: (id: string) => void;
}

/**
 * Creates a selection column for DataTable
 */
export function createSelectColumn<T>(): ColumnDef<T> {
  return {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  };
}

/**
 * Creates an action column for DataTable with View, Edit, Delete, and optional actions
 */
export function createActionColumn<T extends { id: string }>(
  config: ActionConfig<T>
): ColumnDef<T> {
  return {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const item = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {/* View */}
            <DropdownMenuItem asChild>
              <Link href={`${config.basePath}/${item.id}`}>
                <Eye className="mr-2 h-4 w-4" /> View
              </Link>
            </DropdownMenuItem>
            
            {/* Edit */}
            <DropdownMenuItem asChild>
              <Link href={`${config.basePath}/${item.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </Link>
            </DropdownMenuItem>
            
            {/* Duplicate */}
            {config.onDuplicate && (
              <DropdownMenuItem onClick={() => config.onDuplicate?.(item)}>
                <Copy className="mr-2 h-4 w-4" /> Duplicate
              </DropdownMenuItem>
            )}
            
            {/* Print */}
            {config.onPrint && (
              <DropdownMenuItem onClick={() => config.onPrint?.(item.id)}>
                <Printer className="mr-2 h-4 w-4" /> Print
              </DropdownMenuItem>
            )}
            
            {/* Email */}
            {config.onEmail && (
              <DropdownMenuItem onClick={() => config.onEmail?.(item.id)}>
                <Mail className="mr-2 h-4 w-4" /> Email
              </DropdownMenuItem>
            )}
            
            {/* Void/Cancel */}
            {config.onVoid && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => config.onVoid?.(item.id)}
                  className="text-orange-600"
                >
                  <XCircle className="mr-2 h-4 w-4" /> Void
                </DropdownMenuItem>
              </>
            )}
            
            {/* Delete */}
            {config.onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => config.onDelete?.(item.id)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
    enableHiding: false,
  };
}

/**
 * Creates column definitions helper for common patterns
 */
export function createColumns<T extends { id: string }>(
  columns: ColumnDef<T>[],
  actionConfig?: ActionConfig<T>
): ColumnDef<T>[] {
  const result: ColumnDef<T>[] = [
    createSelectColumn<T>(),
    ...columns,
  ];
  
  if (actionConfig) {
    result.push(createActionColumn(actionConfig));
  }
  
  return result;
}
