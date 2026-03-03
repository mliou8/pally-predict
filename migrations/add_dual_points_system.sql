-- Migration: Add Dual Points System (PP and WP)
-- Run this SQL on your PostgreSQL database to add the new columns

-- Add Pally Points (PP) - rare, valuable, implies airdrop
ALTER TABLE users ADD COLUMN IF NOT EXISTS pally_points INTEGER NOT NULL DEFAULT 0;

-- Add Wager Points (WP) - gameplay currency
ALTER TABLE users ADD COLUMN IF NOT EXISTS wager_points INTEGER NOT NULL DEFAULT 1000;

-- Add social verification flags
ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS discord_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_verified BOOLEAN NOT NULL DEFAULT false;

-- Add referral system columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by VARCHAR REFERENCES users(id);

-- Migrate existing alpha_points to pally_points for existing users
UPDATE users SET pally_points = alpha_points WHERE pally_points = 0 AND alpha_points > 0;

-- Give existing users their starting WP if they have 0
UPDATE users SET wager_points = 1000 WHERE wager_points = 0;
