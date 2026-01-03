import "dotenv/config";
import { db } from "./src/db";
import { items, itemPriceTiers } from "./src/db/schema";

async function seedTier() {
  // Get first item
  const item = await db.query.items.findFirst();
  if (!item) {
    console.log("No items found in database");
    process.exit(1);
  }
  
  console.log("Found item:", item.name, "| Base Price:", item.sellingPrice);
  
  // Create a tier: Buy 10+ get 10% off
  const tierPrice = Number(item.sellingPrice) * 0.90;
  
  try {
    await db.insert(itemPriceTiers).values({
      companyId: item.companyId,
      itemId: item.id,
      tierName: "Bulk 10+",
      minQuantity: "10",
      maxQuantity: null,
      unitPrice: tierPrice.toFixed(2),
      discountPercentage: "10",
      effectiveDate: new Date().toISOString().split("T")[0],
    });
    
    console.log("✅ Created tier: 'Bulk 10+' at", tierPrice.toFixed(2), "(10% discount for qty >= 10)");
  } catch (e: any) {
    if (e.code === "23505") {
      console.log("ℹ️ Tier already exists for this item");
    } else {
      throw e;
    }
  }
  
  process.exit(0);
}

seedTier().catch(e => {
  console.error("Error:", e);
  process.exit(1);
});
