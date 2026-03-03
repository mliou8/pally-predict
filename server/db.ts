import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set!');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/test'
});

export const db = drizzle(pool, { schema });

console.log('[db] Database connection initialized');

// Auto-migration: Add missing columns on startup
// This ensures schema changes are applied without manual intervention
export async function runAutoMigrations() {
  const client = await pool.connect();
  try {
    console.log('[db] Running auto-migrations...');

    // Add dual points system columns
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS pally_points INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS wager_points INTEGER NOT NULL DEFAULT 1000;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter_verified BOOLEAN NOT NULL DEFAULT false;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS discord_verified BOOLEAN NOT NULL DEFAULT false;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_verified BOOLEAN NOT NULL DEFAULT false;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_count INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by VARCHAR;
    `);

    console.log('[db] Auto-migrations completed successfully');
  } catch (error) {
    console.error('[db] Auto-migration error:', error);
    // Don't throw - let the app continue even if migration fails
  } finally {
    client.release();
  }
}
