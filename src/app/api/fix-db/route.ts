import { db } from "@/db";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "brand_categories" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "brand_id" uuid NOT NULL REFERENCES "item_brands"("id"),
        "category_id" uuid NOT NULL REFERENCES "item_categories"("id")
      );
    `);
    
    return NextResponse.json({ success: true, message: "Table brand_categories created successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
