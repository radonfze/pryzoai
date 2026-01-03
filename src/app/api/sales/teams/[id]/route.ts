import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { salesTeams } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { checkPermission } from "@/lib/auth/permissions";

export const dynamic = 'force-dynamic';

// GET - Get single team
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const team = await db.query.salesTeams.findFirst({
      where: eq(salesTeams.id, id),
      with: {
        members: {
          with: {
            employee: true,
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(team);
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
  }
}

// PATCH - Update team
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasPermission = await checkPermission(session.user.id, "sales.edit");
    if (!hasPermission) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const body = await request.json();

    const [updated] = await db
      .update(salesTeams)
      .set({
        name: body.name,
        code: body.code,
        description: body.description,
        isActive: body.isActive,
        updatedAt: new Date(),
      })
      .where(eq(salesTeams.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating team:", error);
    return NextResponse.json({ error: "Failed to update team" }, { status: 500 });
  }
}

// DELETE - Delete team
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasPermission = await checkPermission(session.user.id, "sales.delete");
    if (!hasPermission) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    await db.delete(salesTeams).where(eq(salesTeams.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting team:", error);
    return NextResponse.json({ error: "Failed to delete team" }, { status: 500 });
  }
}
