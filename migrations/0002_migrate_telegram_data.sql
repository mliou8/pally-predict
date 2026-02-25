-- Phase 1.6: Data Migration from telegram_users to unified users table
-- This migration should be run AFTER 0001_unified_platform.sql

-- Step 1: Migrate telegram_users → users
-- Insert telegram users into the unified users table
INSERT INTO users (
    telegram_id,
    telegram_username,
    first_name,
    last_name,
    balance,
    total_wagered,
    total_won,
    correct_predictions,
    total_predictions,
    current_streak,
    max_streak,
    primary_platform,
    created_at,
    updated_at
)
SELECT
    telegram_id,
    username,
    first_name,
    last_name,
    balance,
    total_wagered,
    total_won,
    correct_predictions,
    total_predictions,
    current_streak,
    max_streak,
    'telegram',
    created_at,
    updated_at
FROM telegram_users
ON CONFLICT (telegram_id) DO NOTHING;

--> statement-breakpoint

-- Step 2: Create a temporary mapping table for user IDs
CREATE TEMP TABLE user_id_mapping AS
SELECT tu.id AS old_user_id, u.id AS new_user_id
FROM telegram_users tu
JOIN users u ON u.telegram_id = tu.telegram_id;

--> statement-breakpoint

-- Step 3: For each telegram question, find or create a matching unified question
-- First, let's sync telegram questions to unified questions table
INSERT INTO questions (
    type,
    prompt,
    option_a,
    option_b,
    option_c,
    option_d,
    context,
    drops_at,
    reveals_at,
    is_active,
    is_revealed,
    correct_answer,
    telegram_broadcasted_at,
    telegram_results_sent_at,
    created_at
)
SELECT
    'prediction',  -- Default type for telegram questions
    prompt,
    option_a,
    option_b,
    option_c,
    option_d,
    context,
    scheduled_for,
    expires_at,
    is_active,
    is_revealed,
    correct_answer,
    CASE WHEN is_active THEN scheduled_for ELSE NULL END,
    results_sent_at,
    created_at
FROM telegram_questions tq
WHERE NOT EXISTS (
    SELECT 1 FROM questions q WHERE q.prompt = tq.prompt AND q.drops_at = tq.scheduled_for
);

--> statement-breakpoint

-- Step 4: Create question mapping
CREATE TEMP TABLE question_id_mapping AS
SELECT tq.id AS old_question_id, q.id AS new_question_id
FROM telegram_questions tq
JOIN questions q ON q.prompt = tq.prompt AND q.drops_at = tq.scheduled_for;

--> statement-breakpoint

-- Step 5: Migrate telegram_bets → votes
INSERT INTO votes (
    user_id,
    question_id,
    choice,
    bet_amount,
    payout,
    is_correct,
    platform,
    is_public,
    voted_at
)
SELECT
    uim.new_user_id,
    qim.new_question_id,
    tb.choice,
    tb.bet_amount,
    tb.payout,
    tb.is_correct,
    'telegram',
    true,
    tb.created_at
FROM telegram_bets tb
JOIN user_id_mapping uim ON uim.old_user_id = tb.user_id
JOIN question_id_mapping qim ON qim.old_question_id = tb.question_id
ON CONFLICT DO NOTHING;

--> statement-breakpoint

-- Clean up temporary tables
DROP TABLE IF EXISTS user_id_mapping;
DROP TABLE IF EXISTS question_id_mapping;

-- NOTE: Do NOT drop telegram tables yet - verify migration first
-- After verification, run these commands manually:
-- DROP TABLE telegram_bets;
-- DROP TABLE telegram_questions;
-- DROP TABLE telegram_users;
