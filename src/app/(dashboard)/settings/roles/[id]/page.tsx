
// Client Component Wrapper
import { RoleEditor } from "@/components/settings/role-editor";
import { getRoleById } from "@/actions/settings/role-actions";

export default async function RoleDetailPage({ params }: { params: { id: string } }) {
  const role = await getRoleById(params.id);

  if (!role) {
    return <div>Role not found</div>;
  }

  // Cast permissions and serialize dates
  const safeRole = {
    ...role,
    permissions: (role.permissions as string[]) || [],
    createdAt: role.createdAt?.toISOString() ?? null,
    updatedAt: role.updatedAt?.toISOString() ?? null,
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
       <RoleEditor role={safeRole} />
    </div>
  );
}

