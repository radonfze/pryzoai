"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Edit, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Field {
  label: string;
  value: string | number | boolean | null | undefined;
  type?: "text" | "badge" | "date" | "boolean";
}

interface MasterViewDialogProps {
  title: string;
  subtitle?: string;
  fields: Field[];
  editUrl?: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function MasterViewDialog({
  title,
  subtitle,
  fields,
  editUrl,
  trigger,
  open,
  onOpenChange,
}: MasterViewDialogProps) {
  const renderValue = (field: Field) => {
    if (field.value === null || field.value === undefined || field.value === "") {
      return <span className="text-muted-foreground">—</span>;
    }

    switch (field.type) {
      case "badge":
        return <Badge variant="secondary">{String(field.value)}</Badge>;
      case "date":
        return formatDate(field.value as string);
      case "boolean":
        return (
          <Badge variant={field.value ? "default" : "secondary"}>
            {field.value ? "Yes" : "No"}
          </Badge>
        );
      default:
        return <span className="font-medium">{String(field.value)}</span>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{title}</span>
            {subtitle && (
              <Badge variant="outline" className="font-mono">
                {subtitle}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {fields.map((field, index) => (
            <div key={index} className="grid grid-cols-3 items-center gap-4">
              <span className="text-sm text-muted-foreground">{field.label}</span>
              <div className="col-span-2">{renderValue(field)}</div>
            </div>
          ))}
        </div>

        {editUrl && (
          <div className="flex justify-end border-t pt-4">
            <Link href={editUrl}>
              <Button size="sm">
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Button>
            </Link>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Convenience components for specific master types
interface CategoryData {
  id: string;
  code: string;
  name: string;
  nameAr?: string | null;
  description?: string | null;
  isActive: boolean;
  createdAt: Date;
}

export function ViewCategoryDialog({
  data,
  trigger,
  open,
  onOpenChange,
}: {
  data: CategoryData;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <MasterViewDialog
      title="Category Details"
      subtitle={data.code}
      fields={[
        { label: "Name", value: data.name },
        { label: "Arabic Name", value: data.nameAr },
        { label: "Description", value: data.description },
        { label: "Status", value: data.isActive ? "Active" : "Inactive", type: "badge" },
        { label: "Created", value: data.createdAt, type: "date" },
      ]}
      editUrl={`/inventory/categories/${data.id}/edit`}
      trigger={trigger}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}

export function ViewBrandDialog({
  data,
  trigger,
  open,
  onOpenChange,
}: {
  data: CategoryData;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <MasterViewDialog
      title="Brand Details"
      subtitle={data.code}
      fields={[
        { label: "Name", value: data.name },
        { label: "Arabic Name", value: data.nameAr },
        { label: "Description", value: data.description },
        { label: "Status", value: data.isActive ? "Active" : "Inactive", type: "badge" },
        { label: "Created", value: data.createdAt, type: "date" },
      ]}
      editUrl={`/inventory/brands/${data.id}/edit`}
      trigger={trigger}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}

export function ViewModelDialog({
  data,
  trigger,
  open,
  onOpenChange,
}: {
  data: CategoryData & { brand?: { name: string } | null };
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <MasterViewDialog
      title="Model Details"
      subtitle={data.code}
      fields={[
        { label: "Name", value: data.name },
        { label: "Arabic Name", value: data.nameAr },
        { label: "Brand", value: data.brand?.name },
        { label: "Description", value: data.description },
        { label: "Status", value: data.isActive ? "Active" : "Inactive", type: "badge" },
        { label: "Created", value: data.createdAt, type: "date" },
      ]}
      editUrl={`/inventory/models/${data.id}/edit`}
      trigger={trigger}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}

export function ViewSubcategoryDialog({
  data,
  trigger,
  open,
  onOpenChange,
}: {
  data: CategoryData & { category?: { name: string } | null };
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <MasterViewDialog
      title="Subcategory Details"
      subtitle={data.code}
      fields={[
        { label: "Name", value: data.name },
        { label: "Arabic Name", value: data.nameAr },
        { label: "Parent Category", value: data.category?.name },
        { label: "Description", value: data.description },
        { label: "Status", value: data.isActive ? "Active" : "Inactive", type: "badge" },
        { label: "Created", value: data.createdAt, type: "date" },
      ]}
      editUrl={`/inventory/subcategories/${data.id}/edit`}
      trigger={trigger}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}

export function ViewUomDialog({
  data,
  trigger,
  open,
  onOpenChange,
}: {
  data: { id: string; code: string; name: string; nameAr?: string | null; isActive: boolean; createdAt: Date };
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <MasterViewDialog
      title="Unit of Measure Details"
      subtitle={data.code}
      fields={[
        { label: "Code", value: data.code },
        { label: "Name", value: data.name },
        { label: "Arabic Name", value: data.nameAr },
        { label: "Status", value: data.isActive ? "Active" : "Inactive", type: "badge" },
        { label: "Created", value: data.createdAt, type: "date" },
      ]}
      editUrl={`/inventory/uom/${data.id}/edit`}
      trigger={trigger}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}
