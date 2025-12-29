// Quick migration to add missing columns - v3 (items table)
import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function migrate() {
  console.log('Adding missing columns to items table...');
  
  try {
    // Add missing columns to items
    await db.execute(sql`
      ALTER TABLE items 
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
    `);
    console.log('✅ Added deleted_at to items');

    // Add missing columns to customers just in case
    await db.execute(sql`
      ALTER TABLE customers 
      ADD COLUMN IF NOT EXISTS tax_id VARCHAR(15);
    `);
    console.log('✅ Added tax_id to customers');
    
    console.log('✅ Migration complete!');
  } catch (error) {
    console.error('Migration error:', error);
  }
  
  process.exit(0);
}

migrate();
