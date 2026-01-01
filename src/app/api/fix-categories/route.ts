import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export async function GET() {
  try {
    // Add missing columns to item_categories using raw SQL
    await db.execute(sql`
      ALTER TABLE item_categories 
      ADD COLUMN IF NOT EXISTS base_uom_id UUID,
      ADD COLUMN IF NOT EXISTS alternative_uom_id UUID,
      ADD COLUMN IF NOT EXISTS conversion_factor NUMERIC(10,4)
    `);

    return NextResponse.json({ 
      success: true, 
      message: "Added base_uom_id, alternative_uom_id, conversion_factor columns to item_categories" 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
