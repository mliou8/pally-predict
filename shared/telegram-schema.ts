import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Telegram Users - separate from main app users
export const telegramUsers = pgTable("telegram_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  telegramId: varchar("telegram_id").notNull().unique(),
  username: varchar("username"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  balance: decimal("balance", { precision: 12, scale: 2 }).notNull().default("500.00"),
  totalWagered: decimal("total_wagered", { precision: 12, scale: 2 }).notNull().default("0.00"),
  totalWon: decimal("total_won", { precision: 12, scale: 2 }).notNull().default("0.00"),
  correctPredictions: integer("correct_predictions").notNull().default(0),
  totalPredictions: integer("total_predictions").notNull().default(0),
  currentStreak: integer("current_streak").notNull().default(0),
  maxStreak: integer("max_streak").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Telegram Questions - one per day
export const telegramQuestions = pgTable("telegram_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  prompt: text("prompt").notNull(),
  optionA: text("option_a").notNull(),
  optionB: text("option_b").notNull(),
  optionC: text("option_c"),
  optionD: text("option_d"),
  correctAnswer: varchar("correct_answer").$type<'A' | 'B' | 'C' | 'D'>(), // Set when results are revealed
  context: text("context"), // Additional context for the question
  scheduledFor: timestamp("scheduled_for").notNull(), // When to send the question
  expiresAt: timestamp("expires_at").notNull(), // When voting closes
  isActive: boolean("is_active").notNull().default(false), // Currently accepting votes
  isRevealed: boolean("is_revealed").notNull().default(false), // Results have been sent
  resultsSentAt: timestamp("results_sent_at"), // When results notification was sent
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Telegram Bets - user bets on questions
export const telegramBets = pgTable("telegram_bets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => telegramUsers.id),
  questionId: varchar("question_id").notNull().references(() => telegramQuestions.id),
  choice: varchar("choice").notNull().$type<'A' | 'B' | 'C' | 'D'>(),
  betAmount: decimal("bet_amount", { precision: 12, scale: 2 }).notNull(),
  payout: decimal("payout", { precision: 12, scale: 2 }), // Calculated after results
  isCorrect: boolean("is_correct"), // Set when results are revealed
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertTelegramUserSchema = createInsertSchema(telegramUsers).pick({
  telegramId: true,
  username: true,
  firstName: true,
  lastName: true,
});

export const insertTelegramQuestionSchema = createInsertSchema(telegramQuestions).omit({
  id: true,
  createdAt: true,
  isActive: true,
  isRevealed: true,
  resultsSentAt: true,
  correctAnswer: true,
}).extend({
  scheduledFor: z.string().transform((str) => new Date(str)),
  expiresAt: z.string().transform((str) => new Date(str)),
});

export const insertTelegramBetSchema = createInsertSchema(telegramBets).omit({
  id: true,
  createdAt: true,
  payout: true,
  isCorrect: true,
});

// Types
export type TelegramUser = typeof telegramUsers.$inferSelect;
export type InsertTelegramUser = z.infer<typeof insertTelegramUserSchema>;

export type TelegramQuestion = typeof telegramQuestions.$inferSelect;
export type InsertTelegramQuestion = z.infer<typeof insertTelegramQuestionSchema>;

export type TelegramBet = typeof telegramBets.$inferSelect;
export type InsertTelegramBet = z.infer<typeof insertTelegramBetSchema>;

