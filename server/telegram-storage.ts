import { eq, desc, and, lte, gte, sql, isNull } from 'drizzle-orm';
import { db } from './db';
import {
  telegramUsers,
  telegramQuestions,
  telegramBets,
  type TelegramUser,
  type InsertTelegramUser,
  type TelegramQuestion,
  type InsertTelegramQuestion,
  type TelegramBet,
  type InsertTelegramBet,
} from '@shared/telegram-schema';

export interface TelegramQuestionWithStats extends TelegramQuestion {
  totalBets: number;
  totalAmount: string;
  votesA: number;
  votesB: number;
  votesC: number;
  votesD: number;
  amountA: string;
  amountB: string;
  amountC: string;
  amountD: string;
}

export class TelegramStorage {
  // ===== USER OPERATIONS =====
  
  async getUser(id: string): Promise<TelegramUser | undefined> {
    const [user] = await db.select().from(telegramUsers).where(eq(telegramUsers.id, id)).limit(1);
    return user;
  }

  async getUserByTelegramId(telegramId: string): Promise<TelegramUser | undefined> {
    const [user] = await db.select().from(telegramUsers).where(eq(telegramUsers.telegramId, telegramId)).limit(1);
    return user;
  }

  async createUser(insertUser: InsertTelegramUser): Promise<TelegramUser> {
    const [user] = await db.insert(telegramUsers).values([insertUser]).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<TelegramUser>): Promise<TelegramUser | undefined> {
    const [user] = await db
      .update(telegramUsers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(telegramUsers.id, id))
      .returning();
    return user;
  }

  async updateUserBalance(id: string, amount: number): Promise<TelegramUser | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const newBalance = parseFloat(user.balance) + amount;
    return this.updateUser(id, { balance: newBalance.toFixed(2) });
  }

  async getAllUsers(): Promise<TelegramUser[]> {
    return await db.select().from(telegramUsers).orderBy(desc(telegramUsers.createdAt));
  }

  async getLeaderboard(limit: number = 20): Promise<TelegramUser[]> {
    return await db
      .select()
      .from(telegramUsers)
      .orderBy(desc(telegramUsers.balance))
      .limit(limit);
  }

  // ===== QUESTION OPERATIONS =====
  
  async getQuestion(id: string): Promise<TelegramQuestion | undefined> {
    const [question] = await db.select().from(telegramQuestions).where(eq(telegramQuestions.id, id)).limit(1);
    return question;
  }

  async getActiveQuestion(): Promise<TelegramQuestion | undefined> {
    const now = new Date();
    const [question] = await db
      .select()
      .from(telegramQuestions)
      .where(
        and(
          eq(telegramQuestions.isActive, true),
          eq(telegramQuestions.isRevealed, false),
          lte(telegramQuestions.scheduledFor, now),
          gte(telegramQuestions.expiresAt, now)
        )
      )
      .orderBy(desc(telegramQuestions.scheduledFor))
      .limit(1);
    return question;
  }

  async getQuestionsDueToSend(): Promise<TelegramQuestion[]> {
    const now = new Date();
    return await db
      .select()
      .from(telegramQuestions)
      .where(
        and(
          eq(telegramQuestions.isActive, false),
          eq(telegramQuestions.isRevealed, false),
          lte(telegramQuestions.scheduledFor, now)
        )
      );
  }

  async getQuestionsToReveal(): Promise<TelegramQuestion[]> {
    const now = new Date();
    return await db
      .select()
      .from(telegramQuestions)
      .where(
        and(
          eq(telegramQuestions.isActive, true),
          eq(telegramQuestions.isRevealed, false),
          lte(telegramQuestions.expiresAt, now)
        )
      );
  }

  async getUnsentResults(): Promise<TelegramQuestion[]> {
    return await db
      .select()
      .from(telegramQuestions)
      .where(
        and(
          eq(telegramQuestions.isRevealed, true),
          isNull(telegramQuestions.resultsSentAt)
        )
      );
  }

  async getAllQuestions(): Promise<TelegramQuestion[]> {
    return await db
      .select()
      .from(telegramQuestions)
      .orderBy(desc(telegramQuestions.scheduledFor));
  }

  async getUpcomingQuestions(): Promise<TelegramQuestion[]> {
    const now = new Date();
    return await db
      .select()
      .from(telegramQuestions)
      .where(gte(telegramQuestions.scheduledFor, now))
      .orderBy(telegramQuestions.scheduledFor);
  }

  async getPastQuestions(limit: number = 10): Promise<TelegramQuestion[]> {
    return await db
      .select()
      .from(telegramQuestions)
      .where(eq(telegramQuestions.isRevealed, true))
      .orderBy(desc(telegramQuestions.expiresAt))
      .limit(limit);
  }

  async createQuestion(insertQuestion: InsertTelegramQuestion): Promise<TelegramQuestion> {
    const [question] = await db.insert(telegramQuestions).values([insertQuestion]).returning();
    return question;
  }

  async updateQuestion(id: string, updates: Partial<TelegramQuestion>): Promise<TelegramQuestion | undefined> {
    const [question] = await db
      .update(telegramQuestions)
      .set(updates)
      .where(eq(telegramQuestions.id, id))
      .returning();
    return question;
  }

  async deleteQuestion(id: string): Promise<void> {
    // First delete any bets for this question
    await db.delete(telegramBets).where(eq(telegramBets.questionId, id));
    // Then delete the question
    await db.delete(telegramQuestions).where(eq(telegramQuestions.id, id));
  }

  async activateQuestion(id: string): Promise<TelegramQuestion | undefined> {
    return this.updateQuestion(id, { isActive: true });
  }

  async revealQuestion(id: string, correctAnswer: 'A' | 'B' | 'C' | 'D'): Promise<TelegramQuestion | undefined> {
    return this.updateQuestion(id, { 
      isActive: false, 
      isRevealed: true, 
      correctAnswer 
    });
  }

  async markResultsSent(id: string): Promise<TelegramQuestion | undefined> {
    return this.updateQuestion(id, { resultsSentAt: new Date() });
  }

  // ===== BET OPERATIONS =====
  
  async getBet(userId: string, questionId: string): Promise<TelegramBet | undefined> {
    const [bet] = await db
      .select()
      .from(telegramBets)
      .where(and(eq(telegramBets.userId, userId), eq(telegramBets.questionId, questionId)))
      .limit(1);
    return bet;
  }

  async getUserBets(userId: string): Promise<TelegramBet[]> {
    return await db
      .select()
      .from(telegramBets)
      .where(eq(telegramBets.userId, userId))
      .orderBy(desc(telegramBets.createdAt));
  }

  async getQuestionBets(questionId: string): Promise<TelegramBet[]> {
    return await db
      .select()
      .from(telegramBets)
      .where(eq(telegramBets.questionId, questionId));
  }

  async createBet(insertBet: InsertTelegramBet): Promise<TelegramBet> {
    const [bet] = await db.insert(telegramBets).values([insertBet]).returning();
    return bet;
  }

  async updateBet(id: string, updates: Partial<TelegramBet>): Promise<TelegramBet | undefined> {
    const [bet] = await db
      .update(telegramBets)
      .set(updates)
      .where(eq(telegramBets.id, id))
      .returning();
    return bet;
  }

  async getQuestionStats(questionId: string): Promise<{
    totalBets: number;
    totalAmount: number;
    votesA: number;
    votesB: number;
    votesC: number;
    votesD: number;
    amountA: number;
    amountB: number;
    amountC: number;
    amountD: number;
  }> {
    const bets = await this.getQuestionBets(questionId);
    
    const stats = {
      totalBets: bets.length,
      totalAmount: 0,
      votesA: 0,
      votesB: 0,
      votesC: 0,
      votesD: 0,
      amountA: 0,
      amountB: 0,
      amountC: 0,
      amountD: 0,
    };

    for (const bet of bets) {
      const amount = parseFloat(bet.betAmount);
      stats.totalAmount += amount;
      
      switch (bet.choice) {
        case 'A':
          stats.votesA++;
          stats.amountA += amount;
          break;
        case 'B':
          stats.votesB++;
          stats.amountB += amount;
          break;
        case 'C':
          stats.votesC++;
          stats.amountC += amount;
          break;
        case 'D':
          stats.votesD++;
          stats.amountD += amount;
          break;
      }
    }

    return stats;
  }

  // ===== RESULTS PROCESSING =====
  
  async processQuestionResults(questionId: string, correctAnswer: 'A' | 'B' | 'C' | 'D'): Promise<void> {
    // Get all bets for this question
    const bets = await this.getQuestionBets(questionId);
    
    // Calculate total pot and winning pot
    let totalPot = 0;
    let winningPot = 0;
    
    for (const bet of bets) {
      const amount = parseFloat(bet.betAmount);
      totalPot += amount;
      if (bet.choice === correctAnswer) {
        winningPot += amount;
      }
    }

    // Process each bet
    for (const bet of bets) {
      const isCorrect = bet.choice === correctAnswer;
      const betAmount = parseFloat(bet.betAmount);
      let payout = 0;

      if (isCorrect && winningPot > 0) {
        // Winner gets proportional share of total pot
        payout = (betAmount / winningPot) * totalPot;
      }

      // Update bet record
      await this.updateBet(bet.id, {
        isCorrect,
        payout: payout.toFixed(2),
      });

      // Update user balance and stats
      const user = await this.getUser(bet.userId);
      if (user) {
        const updates: Partial<TelegramUser> = {
          totalPredictions: user.totalPredictions + 1,
        };

        if (isCorrect) {
          updates.correctPredictions = user.correctPredictions + 1;
          updates.currentStreak = user.currentStreak + 1;
          updates.maxStreak = Math.max(user.maxStreak, user.currentStreak + 1);
          updates.totalWon = (parseFloat(user.totalWon) + payout).toFixed(2);
          updates.balance = (parseFloat(user.balance) + payout).toFixed(2);
        } else {
          updates.currentStreak = 0;
        }

        await this.updateUser(user.id, updates);
      }
    }

    // Mark question as revealed
    await this.revealQuestion(questionId, correctAnswer);
  }
}

export const telegramStorage = new TelegramStorage();

