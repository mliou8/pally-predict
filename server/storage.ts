import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';
import { db } from './db';
import {
  users,
  questions,
  votes,
  questionResults,
  type User,
  type InsertUser,
  type Question,
  type InsertQuestion,
  type Vote,
  type InsertVote,
  type QuestionResults,
  type InsertQuestionResults,
} from '@shared/schema';

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByPrivyId(privyUserId: string): Promise<User | undefined>;
  getUserByHandle(handle: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  // Question operations
  getQuestion(id: string): Promise<Question | undefined>;
  getActiveQuestions(): Promise<Question[]>;
  getRevealedQuestions(limit?: number): Promise<Question[]>;
  getAllQuestions(): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: string, updates: Partial<Question>): Promise<Question | undefined>;
  deleteQuestion(id: string): Promise<void>;
  
  // Vote operations
  getVote(userId: string, questionId: string): Promise<Vote | undefined>;
  getUserVotes(userId: string): Promise<Vote[]>;
  getQuestionVotes(questionId: string): Promise<Vote[]>;
  getQuestionVotesCount(questionId: string): Promise<number>;
  createVote(vote: InsertVote): Promise<Vote>;
  
  // Question results operations
  getQuestionResults(questionId: string): Promise<QuestionResults | undefined>;
  createQuestionResults(results: InsertQuestionResults): Promise<QuestionResults>;
  updateQuestionResults(questionId: string, updates: Partial<QuestionResults>): Promise<QuestionResults | undefined>;
  
  // Leaderboard operations
  getLeaderboard(limit?: number): Promise<User[]>;
}

export class DbStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  }

  async getUserByPrivyId(privyUserId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.privyUserId, privyUserId)).limit(1);
    return user;
  }

  async getUserByHandle(handle: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.handle, handle)).limit(1);
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values([insertUser]).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Question operations
  async getQuestion(id: string): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id)).limit(1);
    return question;
  }

  async getActiveQuestions(): Promise<Question[]> {
    const now = new Date();
    
    // Get the start of the current 24-hour period (12:00 PM ET today)
    const etNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const currentHour = etNow.getHours();
    
    // If before noon ET, use yesterday's noon as the start
    const startOfPeriod = new Date(etNow);
    if (currentHour < 12) {
      startOfPeriod.setDate(startOfPeriod.getDate() - 1);
    }
    startOfPeriod.setHours(12, 0, 0, 0);
    
    // Get only the 3 most recent active questions from current 24h period
    return await db
      .select()
      .from(questions)
      .where(
        and(
          eq(questions.isActive, true),
          eq(questions.isRevealed, false),
          lte(questions.dropsAt, now),
          gte(questions.dropsAt, startOfPeriod)
        )
      )
      .orderBy(desc(questions.dropsAt))
      .limit(3);
  }

  async getRevealedQuestions(limit: number = 10): Promise<Question[]> {
    return await db
      .select()
      .from(questions)
      .where(eq(questions.isRevealed, true))
      .orderBy(desc(questions.revealsAt))
      .limit(limit);
  }

  async getAllQuestions(): Promise<Question[]> {
    return await db
      .select()
      .from(questions)
      .orderBy(desc(questions.dropsAt));
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const [question] = await db.insert(questions).values([insertQuestion]).returning();
    return question;
  }

  async updateQuestion(id: string, updates: Partial<Question>): Promise<Question | undefined> {
    const [question] = await db
      .update(questions)
      .set(updates)
      .where(eq(questions.id, id))
      .returning();
    return question;
  }

  async deleteQuestion(id: string): Promise<void> {
    await db.delete(questions).where(eq(questions.id, id));
  }

  // Vote operations
  async getVote(userId: string, questionId: string): Promise<Vote | undefined> {
    const [vote] = await db
      .select()
      .from(votes)
      .where(and(eq(votes.userId, userId), eq(votes.questionId, questionId)))
      .limit(1);
    return vote;
  }

  async getUserVotes(userId: string): Promise<Vote[]> {
    return await db
      .select()
      .from(votes)
      .where(eq(votes.userId, userId))
      .orderBy(desc(votes.votedAt));
  }

  async getQuestionVotes(questionId: string): Promise<Vote[]> {
    return await db
      .select()
      .from(votes)
      .where(eq(votes.questionId, questionId));
  }

  async getQuestionVotesCount(questionId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(votes)
      .where(eq(votes.questionId, questionId));
    return result[0]?.count || 0;
  }

  async createVote(insertVote: InsertVote): Promise<Vote> {
    const [vote] = await db.insert(votes).values([insertVote]).returning();
    return vote;
  }

  // Question results operations
  async getQuestionResults(questionId: string): Promise<QuestionResults | undefined> {
    const [results] = await db
      .select()
      .from(questionResults)
      .where(eq(questionResults.questionId, questionId))
      .limit(1);
    return results;
  }

  async createQuestionResults(insertResults: InsertQuestionResults): Promise<QuestionResults> {
    const [results] = await db.insert(questionResults).values([insertResults]).returning();
    return results;
  }

  async updateQuestionResults(
    questionId: string,
    updates: Partial<QuestionResults>
  ): Promise<QuestionResults | undefined> {
    const [results] = await db
      .update(questionResults)
      .set(updates)
      .where(eq(questionResults.questionId, questionId))
      .returning();
    return results;
  }

  // Leaderboard operations
  async getLeaderboard(limit: number = 50): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.alphaPoints), desc(users.currentStreak))
      .limit(limit);
  }
}

export const storage = new DbStorage();
