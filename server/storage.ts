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
  getUserBySolanaAddress(solanaAddress: string): Promise<User | undefined>;
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
  revealExpiredQuestions(now: Date): Promise<void>;
  fastTrackQuestions(newDropsAt: Date, newRevealsAt: Date): Promise<number>;
  
  // Vote operations
  getVote(userId: string, questionId: string): Promise<Vote | undefined>;
  getVoteByTxSignature(txSignature: string): Promise<Vote | undefined>;
  getUserVotes(userId: string): Promise<Vote[]>;
  getQuestionVotes(questionId: string): Promise<Vote[]>;
  getQuestionVotesCount(questionId: string): Promise<number>;
  createVote(vote: InsertVote): Promise<Vote>;
  updateVote(voteId: string, updates: Partial<Vote>): Promise<Vote | undefined>;
  
  // Question results operations
  getQuestionResults(questionId: string): Promise<QuestionResults | undefined>;
  createQuestionResults(results: InsertQuestionResults): Promise<QuestionResults>;
  updateQuestionResults(questionId: string, updates: Partial<QuestionResults>): Promise<QuestionResults | undefined>;
  
  // Leaderboard operations
  getLeaderboard(limit?: number): Promise<LeaderboardEntry[]>;
}

export interface LeaderboardEntry extends User {
  accuracy: number;
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

  async getUserBySolanaAddress(solanaAddress: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.solanaAddress, solanaAddress)).limit(1);
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
    
    // Get current ET time to determine if we're before/after noon
    const etTimeStr = now.toLocaleString('en-US', { 
      timeZone: 'America/New_York',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    // Parse the ET time string (format: "MM/DD/YYYY, HH:mm:ss")
    const [datePart, timePart] = etTimeStr.split(', ');
    const [month, day, year] = datePart.split('/');
    const etHour = parseInt(timePart.split(':')[0]);
    
    // Calculate which noon to use (today or yesterday in ET)
    let cycleStartDate: Date;
    
    if (etHour < 12) {
      // Before noon ET - use yesterday's noon
      // Create date for today noon ET, then subtract 24 hours
      const todayNoonET = new Date(`${year}-${month}-${day}T12:00:00-05:00`); // Use EST offset as base
      
      // Adjust for EDT vs EST
      const etOffset = now.toLocaleString('en-US', { 
        timeZone: 'America/New_York', 
        timeZoneName: 'short' 
      }).includes('EDT') ? -4 : -5;
      
      const adjustedNoonET = new Date(`${year}-${month}-${day}T12:00:00`);
      adjustedNoonET.setHours(12 - etOffset); // Convert to UTC
      
      cycleStartDate = new Date(adjustedNoonET.getTime() - 24 * 60 * 60 * 1000);
    } else {
      // After noon ET - use today's noon
      const etOffset = now.toLocaleString('en-US', { 
        timeZone: 'America/New_York', 
        timeZoneName: 'short' 
      }).includes('EDT') ? -4 : -5;
      
      cycleStartDate = new Date(`${year}-${month}-${day}T12:00:00`);
      cycleStartDate.setHours(12 - etOffset); // Convert to UTC
    }
    
    // Get only the 3 most recent active questions from current 24h period
    return await db
      .select()
      .from(questions)
      .where(
        and(
          eq(questions.isActive, true),
          eq(questions.isRevealed, false),
          lte(questions.dropsAt, now),
          gte(questions.dropsAt, cycleStartDate)
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

  async revealExpiredQuestions(now: Date): Promise<void> {
    // Update all questions that should be revealed in a single efficient query
    await db
      .update(questions)
      .set({ isRevealed: true })
      .where(
        and(
          eq(questions.isRevealed, false),
          lte(questions.revealsAt, now)
        )
      );
  }

  async fastTrackQuestions(newDropsAt: Date, newRevealsAt: Date): Promise<number> {
    // Calculate tomorrow's drop time (what we're searching for)
    const tomorrowDropsAt = new Date(newDropsAt.getTime() + 24 * 60 * 60 * 1000);
    
    // Find tomorrow's questions (24 hours ahead of newDropsAt)
    const tomorrowQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.dropsAt, tomorrowDropsAt));
    
    if (tomorrowQuestions.length === 0) {
      return 0;
    }
    
    // Update their times to today/tomorrow
    await db
      .update(questions)
      .set({
        dropsAt: newDropsAt,
        revealsAt: newRevealsAt
      })
      .where(eq(questions.dropsAt, tomorrowDropsAt));
    
    return tomorrowQuestions.length;
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

  async getVoteByTxSignature(txSignature: string): Promise<Vote | undefined> {
    const [vote] = await db
      .select()
      .from(votes)
      .where(eq(votes.wagerTxSig, txSignature))
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

  async updateVote(voteId: string, updates: Partial<Vote>): Promise<Vote | undefined> {
    const [vote] = await db
      .update(votes)
      .set(updates)
      .where(eq(votes.id, voteId))
      .returning();
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
  async getLeaderboard(limit: number = 50): Promise<LeaderboardEntry[]> {
    const allUsers = await db
      .select()
      .from(users)
      .orderBy(desc(users.alphaPoints), desc(users.currentStreak))
      .limit(limit);

    // Batch-load all question results for revealed questions upfront
    const allResults = await db
      .select()
      .from(questionResults)
      .innerJoin(questions, eq(questionResults.questionId, questions.id))
      .where(eq(questions.isRevealed, true));

    // Create a map of questionId -> results for fast lookup
    const resultsMap = new Map<string, QuestionResults>();
    for (const row of allResults) {
      resultsMap.set(row.question_results.questionId, row.question_results);
    }

    // Calculate accuracy for each user
    const usersWithAccuracy = await Promise.all(
      allUsers.map(async (user) => {
        // Get all user votes on revealed questions
        const userVotesQuery = await db
          .select({
            voteId: votes.id,
            voteChoice: votes.choice,
            questionId: votes.questionId,
          })
          .from(votes)
          .innerJoin(questions, eq(votes.questionId, questions.id))
          .where(and(
            eq(votes.userId, user.id),
            eq(questions.isRevealed, true)
          ));

        if (userVotesQuery.length === 0) {
          return { ...user, accuracy: 0 };
        }

        // Check each vote to see if it was correct
        let correctVotes = 0;
        let votesWithResults = 0;
        
        for (const vote of userVotesQuery) {
          const results = resultsMap.get(vote.questionId);
          if (!results) continue; // Skip votes for questions without results
          
          votesWithResults++;

          // Determine winning option (highest vote count)
          const voteCounts = {
            A: results.votesA,
            B: results.votesB,
            C: results.votesC || 0,
            D: results.votesD || 0,
          };

          const winningChoice = Object.entries(voteCounts)
            .reduce((a, b) => (b[1] > a[1] ? b : a))[0] as 'A' | 'B' | 'C' | 'D';

          if (vote.voteChoice === winningChoice) {
            correctVotes++;
          }
        }

        // Only calculate accuracy if there are votes with results
        const accuracy = votesWithResults > 0 
          ? Math.round((correctVotes / votesWithResults) * 100)
          : 0;
          
        return { ...user, accuracy };
      })
    );

    return usersWithAccuracy;
  }
}

export const storage = new DbStorage();
