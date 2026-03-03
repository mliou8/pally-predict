import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, bigint, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Platform types for unified system
export const platformTypes = z.enum(['web', 'telegram', 'mobile']);
export type PlatformType = z.infer<typeof platformTypes>;

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Web/Mobile authentication (nullable for telegram-only users)
  privyUserId: varchar("privy_user_id").unique(),
  handle: varchar("handle").unique(),
  solanaAddress: varchar("solana_address").unique(),

  // Telegram integration (nullable for web-only users)
  telegramId: varchar("telegram_id").unique(),
  telegramUsername: varchar("telegram_username"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),

  // Mobile authentication (email/password)
  email: varchar("email").unique(),
  passwordHash: varchar("password_hash"),

  // Virtual balance system
  balance: decimal("balance", { precision: 12, scale: 2 }).notNull().default("500.00"),
  totalWagered: decimal("total_wagered", { precision: 12, scale: 2 }).notNull().default("0.00"),
  totalWon: decimal("total_won", { precision: 12, scale: 2 }).notNull().default("0.00"),

  // Prediction stats
  correctPredictions: integer("correct_predictions").notNull().default(0),
  totalPredictions: integer("total_predictions").notNull().default(0),

  // Legacy fields
  alphaPoints: integer("alpha_points").notNull().default(0),
  currentStreak: integer("current_streak").notNull().default(0),
  maxStreak: integer("max_streak").notNull().default(0),
  rank: varchar("rank").notNull().default('Rookie'),
  badgesEarned: text("badges_earned").array().notNull().default(sql`ARRAY[]::text[]`),
  isAdmin: boolean("is_admin").notNull().default(false),

  // Referral system
  referralCount: integer("referral_count").notNull().default(0),
  referredBy: varchar("referred_by").references(() => users.id),

  // Account linking
  linkedAt: timestamp("linked_at"),
  primaryPlatform: varchar("primary_platform").$type<PlatformType>().default('web'),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const questionTypes = z.enum(['consensus', 'prediction', 'preference']);
export type QuestionType = z.infer<typeof questionTypes>;

export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type").notNull().$type<QuestionType>(),
  prompt: text("prompt").notNull(),
  optionA: text("option_a").notNull(),
  optionB: text("option_b").notNull(),
  optionC: text("option_c"),
  optionD: text("option_d"),
  context: text("context"),
  dropsAt: timestamp("drops_at").notNull(),
  revealsAt: timestamp("reveals_at").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  isRevealed: boolean("is_revealed").notNull().default(false),

  // Telegram integration
  telegramBroadcastedAt: timestamp("telegram_broadcasted_at"),
  telegramResultsSentAt: timestamp("telegram_results_sent_at"),

  // Correct answer for prediction questions (A, B, C, or D)
  correctAnswer: varchar("correct_answer").$type<VoteChoice>(),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const voteChoices = z.enum(['A', 'B', 'C', 'D']);
export type VoteChoice = z.infer<typeof voteChoices>;

export const votes = pgTable("votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  questionId: varchar("question_id").notNull().references(() => questions.id),
  choice: varchar("choice").notNull().$type<VoteChoice>(),
  isPublic: boolean("is_public").notNull().default(true),
  pointsEarned: integer("points_earned"),
  multiplier: integer("multiplier"),

  // Virtual balance betting (decimal)
  betAmount: decimal("bet_amount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  payout: decimal("payout", { precision: 12, scale: 2 }),
  isCorrect: boolean("is_correct"),
  platform: varchar("platform").$type<PlatformType>().notNull().default('web'),

  // Solana wagering (bigint for lamports)
  wagerAmount: bigint("wager_amount", { mode: 'bigint' }).notNull().default(sql`0`),
  payoutAmount: bigint("payout_amount", { mode: 'bigint' }).default(sql`0`),
  wagerTxSig: varchar("wager_tx_sig"),
  payoutTxSig: varchar("payout_tx_sig"),

  votedAt: timestamp("voted_at").notNull().defaultNow(),
});

export const questionResults = pgTable("question_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questionId: varchar("question_id").notNull().unique().references(() => questions.id),
  totalVotes: integer("total_votes").notNull(),
  percentA: integer("percent_a").notNull().default(0),
  percentB: integer("percent_b").notNull().default(0),
  percentC: integer("percent_c").default(0),
  percentD: integer("percent_d").default(0),
  votesA: integer("votes_a").notNull().default(0),
  votesB: integer("votes_b").notNull().default(0),
  votesC: integer("votes_c").default(0),
  votesD: integer("votes_d").default(0),
  rarityMultipliers: jsonb("rarity_multipliers").$type<{A: number, B: number, C?: number, D?: number}>(),

  // Virtual balance amounts per option
  amountA: decimal("amount_a", { precision: 12, scale: 2 }).notNull().default("0.00"),
  amountB: decimal("amount_b", { precision: 12, scale: 2 }).notNull().default("0.00"),
  amountC: decimal("amount_c", { precision: 12, scale: 2 }).default("0.00"),
  amountD: decimal("amount_d", { precision: 12, scale: 2 }).default("0.00"),
  totalPoolAmount: decimal("total_pool_amount", { precision: 12, scale: 2 }).notNull().default("0.00"),

  // Solana pot (lamports)
  totalPot: bigint("total_pot", { mode: 'bigint' }).notNull().default(sql`0`),
  revealedAt: timestamp("revealed_at"),
});

// Account link tokens for connecting Telegram to Web/Mobile accounts
export const accountLinkTokens = pgTable("account_link_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  token: varchar("token", { length: 6 }).notNull().unique(),
  telegramId: varchar("telegram_id").notNull(),
  telegramUsername: varchar("telegram_username"),
  claimedByUserId: varchar("claimed_by_user_id").references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
  claimedAt: timestamp("claimed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  privyUserId: true,
  handle: true,
});

export const insertTelegramUserSchema = createInsertSchema(users).pick({
  telegramId: true,
  telegramUsername: true,
  firstName: true,
  lastName: true,
  primaryPlatform: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
}).extend({
  dropsAt: z.string().transform((str) => new Date(str)),
  revealsAt: z.string().transform((str) => new Date(str)),
});

export const insertVoteSchema = createInsertSchema(votes).omit({
  id: true,
  votedAt: true,
  pointsEarned: true,
  multiplier: true,
  payoutAmount: true,
  payout: true,
  isCorrect: true,
}).extend({
  wagerAmount: z.union([z.string(), z.bigint()]).transform(val =>
    typeof val === 'string' ? BigInt(val) : val
  ).optional(),
  betAmount: z.union([z.string(), z.number()]).transform(val =>
    typeof val === 'number' ? val.toFixed(2) : val
  ).optional(),
});

export const insertQuestionResultsSchema = createInsertSchema(questionResults).omit({
  id: true,
  revealedAt: true,
});

export const insertAccountLinkTokenSchema = createInsertSchema(accountLinkTokens).omit({
  id: true,
  createdAt: true,
  claimedAt: true,
  claimedByUserId: true,
}).extend({
  expiresAt: z.union([z.string(), z.date()]).transform((val) =>
    typeof val === 'string' ? new Date(val) : val
  ),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertTelegramUser = z.infer<typeof insertTelegramUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;

export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Vote = typeof votes.$inferSelect;

export type InsertQuestionResults = z.infer<typeof insertQuestionResultsSchema>;
export type QuestionResults = typeof questionResults.$inferSelect;

export type InsertAccountLinkToken = z.infer<typeof insertAccountLinkTokenSchema>;
export type AccountLinkToken = typeof accountLinkTokens.$inferSelect;
