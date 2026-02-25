CREATE TABLE "question_results" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" varchar NOT NULL,
	"total_votes" integer NOT NULL,
	"percent_a" integer DEFAULT 0 NOT NULL,
	"percent_b" integer DEFAULT 0 NOT NULL,
	"percent_c" integer DEFAULT 0,
	"percent_d" integer DEFAULT 0,
	"votes_a" integer DEFAULT 0 NOT NULL,
	"votes_b" integer DEFAULT 0 NOT NULL,
	"votes_c" integer DEFAULT 0,
	"votes_d" integer DEFAULT 0,
	"rarity_multipliers" jsonb,
	"total_pot" bigint DEFAULT 0 NOT NULL,
	"revealed_at" timestamp,
	CONSTRAINT "question_results_question_id_unique" UNIQUE("question_id")
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar NOT NULL,
	"prompt" text NOT NULL,
	"option_a" text NOT NULL,
	"option_b" text NOT NULL,
	"option_c" text,
	"option_d" text,
	"context" text,
	"drops_at" timestamp NOT NULL,
	"reveals_at" timestamp NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_revealed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"privy_user_id" varchar NOT NULL,
	"handle" varchar,
	"solana_address" varchar,
	"alpha_points" integer DEFAULT 0 NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"max_streak" integer DEFAULT 0 NOT NULL,
	"rank" varchar DEFAULT 'Rookie' NOT NULL,
	"badges_earned" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_privy_user_id_unique" UNIQUE("privy_user_id"),
	CONSTRAINT "users_handle_unique" UNIQUE("handle"),
	CONSTRAINT "users_solana_address_unique" UNIQUE("solana_address")
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"question_id" varchar NOT NULL,
	"choice" varchar NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"points_earned" integer,
	"multiplier" integer,
	"wager_amount" bigint DEFAULT 0 NOT NULL,
	"payout_amount" bigint DEFAULT 0,
	"wager_tx_sig" varchar,
	"payout_tx_sig" varchar,
	"voted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "telegram_bets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"question_id" varchar NOT NULL,
	"choice" varchar NOT NULL,
	"bet_amount" numeric(12, 2) NOT NULL,
	"payout" numeric(12, 2),
	"is_correct" boolean,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "telegram_questions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prompt" text NOT NULL,
	"option_a" text NOT NULL,
	"option_b" text NOT NULL,
	"option_c" text,
	"option_d" text,
	"correct_answer" varchar,
	"context" text,
	"scheduled_for" timestamp NOT NULL,
	"expires_at" timestamp NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"is_revealed" boolean DEFAULT false NOT NULL,
	"results_sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "telegram_users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"telegram_id" varchar NOT NULL,
	"username" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"balance" numeric(12, 2) DEFAULT '500.00' NOT NULL,
	"total_wagered" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"total_won" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"correct_predictions" integer DEFAULT 0 NOT NULL,
	"total_predictions" integer DEFAULT 0 NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"max_streak" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "telegram_users_telegram_id_unique" UNIQUE("telegram_id")
);
--> statement-breakpoint
ALTER TABLE "question_results" ADD CONSTRAINT "question_results_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_bets" ADD CONSTRAINT "telegram_bets_user_id_telegram_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."telegram_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_bets" ADD CONSTRAINT "telegram_bets_question_id_telegram_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."telegram_questions"("id") ON DELETE no action ON UPDATE no action;