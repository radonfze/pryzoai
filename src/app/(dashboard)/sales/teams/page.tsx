import { db } from "@/db";
import { salesTeams } from "@/db/schema/sales-teams";
import { DataTable } from "@/components/ui/data-table";
import { createActionColumn } from "@/components/ui/data-table-columns";
import { GradientHeader } from "@/components/ui/gradient-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { getSalesTeams } from "@/actions/sales/teams";

export default async function SalesTeamsPage() {
  const teams = await getSalesTeams();

  const columns = [
    {
      accessorKey: "name",
      header: "Team Name",
    },
    {
      accessorKey: "manager.name",
      header: "Manager",
      cell: ({ row }: any) => row.original.manager?.name || "-",
    },
    {
      accessorKey: "members",
      header: "Members",
      cell: ({ row }: any) => row.original.members?.length || 0,
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }: any) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            row.original.isActive
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {row.original.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    createActionColumn({
      basePath: "/sales/teams",
      hasEdit: true,
      hasDelete: true,
    }),
  ];

  return (
    <div className="space-y-6">
      <GradientHeader
        module="sales"
        title="Sales Teams"
        description="Manage sales teams, commissions, and targets"
        icon="Users"
      >
        <Link href="/sales/teams/new">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Team
          </Button>
        </Link>
      </GradientHeader>

      <DataTable
        columns={columns}
        data={teams}
        searchKey="name"
        exportName="sales_teams"
      />
    </div>
  );
}
