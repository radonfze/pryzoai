import { NextResponse } from "next/server";
import { Pool } from "@neondatabase/serverless";

export async function GET() {
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // Add missing columns to item_categories
    await pool.query(`
      ALTER TABLE item_categories 
      ADD COLUMN IF NOT EXISTS base_uom_id UUID REFERENCES uoms(id),
      ADD COLUMN IF NOT EXISTS alternative_uom_id UUID REFERENCES uoms(id),
      ADD COLUMN IF NOT EXISTS conversion_factor NUMERIC(10,4);
    `);
    
    // Also drop the old default_uom_id column if it exists
    try {
      await pool.query(`
        ALTER TABLE item_categories 
        DROP COLUMN IF EXISTS default_uom_id;
      `);
    } catch (e) {
      // Ignore if column doesn't exist
    }

    await pool.end();

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
