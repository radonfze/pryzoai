import { db } from "@/db";
import { itemCategories } from "@/db/schema/item-hierarchy";
import { eq } from "drizzle-orm";

async function main() {
    console.log("Testing db.query.itemCategories...");
    try {
        if (!db.query.itemCategories) {
            console.error("ERROR: db.query.itemCategories is UNDEFINED!");
            console.log("Available keys:", Object.keys(db.query));
        } else {
            const cats = await db.query.itemCategories.findMany();
            console.log("Success! Found categories:", cats.length);
            console.log("First category:", cats[0]);
        }
    } catch (e) {
        console.error("Query Failed:", e);
    }
    process.exit(0);
}

main();
