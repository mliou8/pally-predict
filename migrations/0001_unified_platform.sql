-- Phase 1: Unified Platform Migration
-- Add new columns to users table for unified system

-- 1.1 Add Telegram integration columns to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "telegram_id" varchar UNIQUE;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "telegram_username" varchar;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "first_name" varchar;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_name" varchar;

-- 1.2 Add virtual balance system columns to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "balance" numeric(12, 2) DEFAULT '500.00' NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "total_wagered" numeric(12, 2) DEFAULT '0.00' NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "total_won" numeric(12, 2) DEFAULT '0.00' NOT NULL;

-- 1.3 Add prediction stats columns to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "correct_predictions" integer DEFAULT 0 NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "total_predictions" integer DEFAULT 0 NOT NULL;

-- 1.4 Add account linking columns to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "linked_at" timestamp;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "primary_platform" varchar DEFAULT 'web';

-- 1.5 Make privy_user_id nullable (for telegram-only users)
ALTER TABLE "users" ALTER COLUMN "privy_user_id" DROP NOT NULL;

-- 1.6 Add mobile authentication columns
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email" varchar UNIQUE;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" varchar;

--> statement-breakpoint

-- 2.1 Add Telegram integration columns to questions
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "telegram_broadcasted_at" timestamp;
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "telegram_results_sent_at" timestamp;
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "correct_answer" varchar;

--> statement-breakpoint

-- 3.1 Add virtual balance betting columns to votes
ALTER TABLE "votes" ADD COLUMN IF NOT EXISTS "bet_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL;
ALTER TABLE "votes" ADD COLUMN IF NOT EXISTS "payout" numeric(12, 2);
ALTER TABLE "votes" ADD COLUMN IF NOT EXISTS "is_correct" boolean;
ALTER TABLE "votes" ADD COLUMN IF NOT EXISTS "platform" varchar DEFAULT 'web' NOT NULL;

--> statement-breakpoint

-- 4.1 Add virtual balance amounts to question_results
ALTER TABLE "question_results" ADD COLUMN IF NOT EXISTS "amount_a" numeric(12, 2) DEFAULT '0.00' NOT NULL;
ALTER TABLE "question_results" ADD COLUMN IF NOT EXISTS "amount_b" numeric(12, 2) DEFAULT '0.00' NOT NULL;
ALTER TABLE "question_results" ADD COLUMN IF NOT EXISTS "amount_c" numeric(12, 2) DEFAULT '0.00';
ALTER TABLE "question_results" ADD COLUMN IF NOT EXISTS "amount_d" numeric(12, 2) DEFAULT '0.00';
ALTER TABLE "question_results" ADD COLUMN IF NOT EXISTS "total_pool_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL;

--> statement-breakpoint

-- 5.1 Create account_link_tokens table
CREATE TABLE IF NOT EXISTS "account_link_tokens" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "token" varchar(6) NOT NULL,
    "telegram_id" varchar NOT NULL,
    "telegram_username" varchar,
    "claimed_by_user_id" varchar,
    "expires_at" timestamp NOT NULL,
    "claimed_at" timestamp,
    "created_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "account_link_tokens_token_unique" UNIQUE("token")
);

--> statement-breakpoint

-- Add foreign key for claimed_by_user_id
ALTER TABLE "account_link_tokens" ADD CONSTRAINT "account_link_tokens_claimed_by_user_id_users_id_fk"
    FOREIGN KEY ("claimed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
