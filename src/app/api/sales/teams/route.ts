import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { salesTeams } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { checkPermission } from "@/lib/auth/permissions";

export const dynamic = 'force-dynamic';

// GET - List all sales teams
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teams = await db.query.salesTeams.findMany({
      with: {
        members: true,
      },
      orderBy: [desc(salesTeams.createdAt)],
    });

    // Add member count
    const teamsWithCount = teams.map(team => ({
      ...team,
      memberCount: team.members?.length || 0,
    }));

    return NextResponse.json(teamsWithCount);
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 });
  }
}

// POST - Create new sales team
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasPermission = await checkPermission(session.user.id, "sales.create");
    if (!hasPermission) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const body = await request.json();
    
    const [newTeam] = await db
      .insert(salesTeams)
      .values({
        companyId: body.companyId || "00000000-0000-0000-0000-000000000000",
        name: body.name,
        code: body.code,
        description: body.description,
        isActive: body.isActive ?? true,
        createdBy: session.user.id,
      })
      .returning();

    return NextResponse.json(newTeam, { status: 201 });
  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json({ error: "Failed to create team" }, { status: 500 });
  }
}
