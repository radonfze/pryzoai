import { db } from "@/db";
import { salesTeams } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import GradientHeader from "@/components/ui/gradient-header";
import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function SalesTeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const team = await db.query.salesTeams.findFirst({
    where: eq(salesTeams.id, id),
    with: {
      members: {
        with: {
          employee: true
        }
      }
    }
  });

  if (!team) notFound();

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="sales"
        title={`Sales Team: ${team.name}`}
        description={team.description || "Sales team management"}
        icon={Users}
      />

      <div className="flex justify-end gap-2">
        <Link href={`/sales/teams`}>
          <Button variant="outline">Back to List</Button>
        </Link>
        <Link href={`/sales/teams/${id}/edit`}>
          <Button>Edit Team</Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-lg">Team Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Team Name</span><span className="font-medium">{team.name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Code</span><span>{team.code || "-"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant={team.isActive ? "default" : "secondary"}>{team.isActive ? "Active" : "Inactive"}</Badge></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Members</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{team.members?.length || 0}</div>
            <div className="text-sm text-muted-foreground mt-2">Team Members</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Description</CardTitle></CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{team.description || "No description provided"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Team Members</CardTitle></CardHeader>
        <CardContent>
          {team.members && team.members.length > 0 ? (
            <div className="space-y-2">
              {team.members.map((member: any) => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{member.employee?.name || "Unknown"}</div>
                    <div className="text-sm text-muted-foreground">{member.role || "Member"}</div>
                  </div>
                  <Badge variant="outline">{member.isLeader ? "Leader" : "Member"}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No members assigned</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
