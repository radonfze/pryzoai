import { db } from "@/db";
import { otpVerifications, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { OtpLogsClient } from "./client";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function OtpLogsPage() {
  const session = await getSession();
  if (!session?.userId) {
    redirect("/login");
  }

  // Fetch recent OTP verifications with user info
  const otpLogs = await db
    .select({
      id: otpVerifications.id,
      otpCode: otpVerifications.otpCode,
      purpose: otpVerifications.purpose,
      targetTable: otpVerifications.targetTable,
      targetId: otpVerifications.targetId,
      expiresAt: otpVerifications.expiresAt,
      verifiedAt: otpVerifications.verifiedAt,
      createdAt: otpVerifications.createdAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(otpVerifications)
    .leftJoin(users, eq(otpVerifications.userId, users.id))
    .orderBy(desc(otpVerifications.createdAt))
    .limit(100);

  // Serialize dates
  const serializedLogs = otpLogs.map((log) => ({
    ...log,
    expiresAt: log.expiresAt?.toISOString() || null,
    verifiedAt: log.verifiedAt?.toISOString() || null,
    createdAt: log.createdAt?.toISOString() || null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">OTP Logs</h1>
        <p className="text-muted-foreground">
          View recent OTP verification attempts for master data deletion.
        </p>
      </div>

      <OtpLogsClient logs={serializedLogs} />
    </div>
  );
}
