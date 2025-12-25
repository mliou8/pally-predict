import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  privyUserId: varchar("privy_user_id").notNull().unique(),
  handle: varchar("handle").unique(),
  solanaAddress: varchar("solana_address").unique(),
  alphaPoints: integer("alpha_points").notNull().default(0),
  currentStreak: integer("current_streak").notNull().default(0),
  maxStreak: integer("max_streak").notNull().default(0),
  rank: varchar("rank").notNull().default('Rookie'),
  badgesEarned: text("badges_earned").array().notNull().default(sql`ARRAY[]::text[]`),
  isAdmin: boolean("is_admin").notNull().default(false),
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
  totalPot: bigint("total_pot", { mode: 'bigint' }).notNull().default(sql`0`),
  revealedAt: timestamp("revealed_at"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  privyUserId: true,
  handle: true,
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
}).extend({
  wagerAmount: z.union([z.string(), z.bigint()]).transform(val => 
    typeof val === 'string' ? BigInt(val) : val
  ).optional(),
});

export const insertQuestionResultsSchema = createInsertSchema(questionResults).omit({
  id: true,
  revealedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;

export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Vote = typeof votes.$inferSelect;

export type InsertQuestionResults = z.infer<typeof insertQuestionResultsSchema>;
export type QuestionResults = typeof questionResults.$inferSelect;
