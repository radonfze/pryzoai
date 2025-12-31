import { db } from "@/db";
import { users, companies } from "@/db/schema";
import { sql } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export default async function DebugAuthPage() {
    let dbStatus = "Unknown";
    let userCount = -1;
    let companyCount = -1;
    let errorMsg = "";
    let envCheck = "";

    try {
        // Check DB Connection
        await db.execute(sql`SELECT 1`);
        dbStatus = "Connected ✅";

        // Check Users
        const userList = await db.select({ count: sql<number>`count(*)` }).from(users);
        userCount = Number(userList[0]?.count || 0);

        // Check Companies
        const companyList = await db.select({ count: sql<number>`count(*)` }).from(companies);
        companyCount = Number(companyList[0]?.count || 0);
        
        envCheck = process.env.DATABASE_URL ? "DATABASE_URL is set" : "DATABASE_URL is MISSING ❌";

    } catch (e: any) {
        dbStatus = "Failed ❌";
        errorMsg = e.message;
        console.error(e);
    }

    return (
        <div className="p-10 font-mono">
            <h1 className="text-2xl font-bold mb-4">Auth/DB Diagnostics</h1>
            <div className="space-y-2 border p-4 rounded bg-slate-50">
                <div><strong>Database Status:</strong> {dbStatus}</div>
                <div><strong>Environment:</strong> {envCheck}</div>
                <div><strong>User Count:</strong> {userCount}</div>
                <div><strong>Company Count:</strong> {companyCount}</div>
                {errorMsg && (
                    <div className="text-red-500 mt-4">
                        <strong>Error:</strong>
                        <pre className="whitespace-pre-wrap">{errorMsg}</pre>
                    </div>
                )}
            </div>
            <div className="mt-8 text-sm text-gray-500">
                Timestamp: {new Date().toISOString()}
            </div>
        </div>
    );
}
