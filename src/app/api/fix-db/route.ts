import { db } from "@/db";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Verify tables
    const brandCats = await db.execute(sql`SELECT count(*) FROM "brand_categories"`);
    const itemCats = await db.execute(sql`SELECT count(*) FROM "item_categories"`);
    
    return NextResponse.json({ 
      success: true, 
      brandCategoriesCount: Number(brandCats[0].count),
      itemCategoriesCount: Number(itemCats[0].count),
      message: "Tables verified." 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, stack: error.stack }, { status: 500 });
  }
}
