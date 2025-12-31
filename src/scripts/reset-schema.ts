
import { db } from "../db";
import { sql } from "drizzle-orm";

async function resetSchema() {
    console.log("Dropping core tables to force schema sync...");
    try {
        await db.execute(sql`DROP TABLE IF EXISTS "user_roles" CASCADE;`);
        await db.execute(sql`DROP TABLE IF EXISTS "users" CASCADE;`);
        await db.execute(sql`DROP TABLE IF EXISTS "roles" CASCADE;`);
        await db.execute(sql`DROP TABLE IF EXISTS "companies" CASCADE;`);
        console.log("Tables dropped.");
    } catch (e) {
        console.error("Error dropping tables:", e);
    }
    process.exit(0);
}

resetSchema();
