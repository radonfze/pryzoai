
import { db } from "../db";
import { sql } from "drizzle-orm";

async function checkColumns() {
    try {
        const result = await db.execute(sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users';
        `);
        console.log("Columns in users table:", result);
    } catch (e) {
        console.error("Error checking columns:", e);
    }
    process.exit(0);
}

checkColumns();
