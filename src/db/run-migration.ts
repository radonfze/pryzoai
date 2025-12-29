import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function runMigrate() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
  }

  console.log('Connecting to database...');
  const migrationClient = postgres(process.env.DATABASE_URL, { max: 1, ssl: { rejectUnauthorized: false } });
  const db = drizzle(migrationClient);

  console.log('Running migrations from ./drizzle folder...');
  
  try {
    await migrate(db, { migrationsFolder: './drizzle/migrations' });
    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await migrationClient.end();
  }
}

runMigrate().catch((err) => {
  console.error('Fatal error during migration:', err);
  process.exit(1);
});
