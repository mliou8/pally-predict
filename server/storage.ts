import { eq, desc, and, gte, lte, sql, isNull, lt } from 'drizzle-orm';
import { db } from './db';
import { broadcastPoolUpdate } from './websocket';
import {
  users,
  questions,
  votes,
  questionResults,
  accountLinkTokens,
  type User,
  type InsertUser,
  type InsertTelegramUser,
  type Question,
  type InsertQuestion,
  type Vote,
  type InsertVote,
  type QuestionResults,
  type InsertQuestionResults,
  type AccountLinkToken,
  type InsertAccountLinkToken,
  type VoteChoice,
  type PlatformType,
} from '@shared/schema';

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByPrivyId(privyUserId: string): Promise<User | undefined>;
  getUserByHandle(handle: string): Promise<User | undefined>;
  getUserBySolanaAddress(solanaAddress: string): Promise<User | undefined>;
  getUserByTelegramId(telegramId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createUserFromTelegram(data: InsertTelegramUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  updateUserBalance(userId: string, delta: number): Promise<User | undefined>;
  getUserBalance(userId: string): Promise<number>;
  getAllUsers(): Promise<User[]>;
  getUsersByPlatform(platform: PlatformType): Promise<User[]>;

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
  getQuestionsDueToBroadcast(): Promise<Question[]>;
  getQuestionsToReveal(): Promise<Question[]>;
  getUnsentResults(): Promise<Question[]>;

  // Vote operations
  getVote(userId: string, questionId: string): Promise<Vote | undefined>;
  getVoteByTxSignature(txSignature: string): Promise<Vote | undefined>;
  getUserVotes(userId: string): Promise<Vote[]>;
  getQuestionVotes(questionId: string): Promise<Vote[]>;
  getQuestionVotesCount(questionId: string): Promise<number>;
  createVote(vote: InsertVote): Promise<Vote>;
  createVoteWithBet(data: { userId: string; questionId: string; choice: VoteChoice; betAmount: number; platform: PlatformType }): Promise<Vote>;
  updateVote(voteId: string, updates: Partial<Vote>): Promise<Vote | undefined>;

  // Question results operations
  getQuestionResults(questionId: string): Promise<QuestionResults | undefined>;
  createQuestionResults(results: InsertQuestionResults): Promise<QuestionResults>;
  updateQuestionResults(questionId: string, updates: Partial<QuestionResults>): Promise<QuestionResults | undefined>;
  processQuestionResults(questionId: string, correctAnswer: VoteChoice): Promise<void>;
  getQuestionStats(questionId: string): Promise<QuestionStats>;

  // Account linking operations
  createLinkToken(data: InsertAccountLinkToken): Promise<AccountLinkToken>;
  getLinkToken(token: string): Promise<AccountLinkToken | undefined>;
  claimLinkToken(token: string, userId: string): Promise<AccountLinkToken | undefined>;
  cleanupExpiredTokens(): Promise<void>;

  // Leaderboard operations
  getLeaderboard(limit?: number): Promise<LeaderboardEntry[]>;
  getUnifiedLeaderboard(limit?: number): Promise<LeaderboardEntry[]>;

  // Reward distribution (atomic transaction)
  distributeRewards(params: {
    questionVotes: Vote[];
    winningChoice: VoteChoice;
    secondPlaceChoice: VoteChoice | null;
    rarityMultipliers: Record<VoteChoice, number>;
    totalPot: bigint;
  }): Promise<void>;
}

export interface LeaderboardEntry extends User {
  accuracy: number;
}

export interface QuestionStats {
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

  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values([insertUser]).returning();
    return user;
  }

  async createUserFromTelegram(data: InsertTelegramUser): Promise<User> {
    const [user] = await db.insert(users).values([{
      ...data,
      primaryPlatform: 'telegram' as PlatformType,
    }]).returning();
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

  async updateUserBalance(userId: string, delta: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const newBalance = parseFloat(user.balance) + delta;
    return this.updateUser(userId, { balance: newBalance.toFixed(2) });
  }

  async getUserBalance(userId: string): Promise<number> {
    const user = await this.getUser(userId);
    return user ? parseFloat(user.balance) : 0;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUsersByPlatform(platform: PlatformType): Promise<User[]> {
    return await db.select().from(users).where(eq(users.primaryPlatform, platform)).orderBy(desc(users.createdAt));
  }

  // Question operations
  async getQuestion(id: string): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id)).limit(1);
    return question;
  }

  async getActiveQuestions(): Promise<Question[]> {
    const now = new Date();

    // Simple approach: get all active, non-revealed questions where dropsAt has passed
    // and revealsAt hasn't passed yet
    return await db
      .select()
      .from(questions)
      .where(
        and(
          eq(questions.isActive, true),
          eq(questions.isRevealed, false),
          lte(questions.dropsAt, now),
          gte(questions.revealsAt, now)
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
    const [question] = await db.insert(questions).values([insertQuestion as any]).returning();
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

  // Telegram-specific question queries
  async getQuestionsDueToBroadcast(): Promise<Question[]> {
    const now = new Date();
    return await db
      .select()
      .from(questions)
      .where(
        and(
          eq(questions.isActive, true),
          eq(questions.isRevealed, false),
          lte(questions.dropsAt, now),
          isNull(questions.telegramBroadcastedAt)
        )
      );
  }

  async getQuestionsToReveal(): Promise<Question[]> {
    const now = new Date();
    return await db
      .select()
      .from(questions)
      .where(
        and(
          eq(questions.isActive, true),
          eq(questions.isRevealed, false),
          lte(questions.revealsAt, now)
        )
      );
  }

  async getUnsentResults(): Promise<Question[]> {
    return await db
      .select()
      .from(questions)
      .where(
        and(
          eq(questions.isRevealed, true),
          isNull(questions.telegramResultsSentAt)
        )
      );
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
    const [vote] = await db.insert(votes).values([insertVote as any]).returning();

    // Broadcast pool update via WebSocket
    broadcastPoolUpdate(vote.questionId).catch(err =>
      console.error('Error broadcasting pool update:', err)
    );

    return vote;
  }

  async createVoteWithBet(data: {
    userId: string;
    questionId: string;
    choice: VoteChoice;
    betAmount: number;
    platform: PlatformType;
  }): Promise<Vote> {
    // Deduct balance from user
    const user = await this.getUser(data.userId);
    if (!user) {
      throw new Error('User not found');
    }

    const currentBalance = parseFloat(user.balance);
    if (data.betAmount > currentBalance) {
      throw new Error('Insufficient balance');
    }

    // Update user balance and totalWagered
    await this.updateUser(data.userId, {
      balance: (currentBalance - data.betAmount).toFixed(2),
      totalWagered: (parseFloat(user.totalWagered) + data.betAmount).toFixed(2),
    });

    // Create the vote
    const [vote] = await db.insert(votes).values([{
      userId: data.userId,
      questionId: data.questionId,
      choice: data.choice,
      betAmount: data.betAmount.toFixed(2),
      platform: data.platform,
      isPublic: true,
    }]).returning();

    // Broadcast pool update via WebSocket
    broadcastPoolUpdate(data.questionId).catch(err =>
      console.error('Error broadcasting pool update:', err)
    );

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

  // Question stats for betting pool display
  async getQuestionStats(questionId: string): Promise<QuestionStats> {
    const allVotes = await this.getQuestionVotes(questionId);

    const stats: QuestionStats = {
      totalBets: allVotes.length,
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

    for (const vote of allVotes) {
      const amount = parseFloat(vote.betAmount);
      stats.totalAmount += amount;

      switch (vote.choice) {
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
    const [results] = await db.insert(questionResults).values([insertResults as any]).returning();
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

  // Distribute rewards atomically using a database transaction
  // Points-based system: winners get pot share, 2nd place gets 25% consolation
  async distributeRewards(params: {
    questionVotes: Vote[];
    winningChoice: VoteChoice;
    secondPlaceChoice: VoteChoice | null;
    rarityMultipliers: Record<VoteChoice, number>;
    totalPot: bigint;
  }): Promise<void> {
    const { questionVotes, winningChoice, secondPlaceChoice, rarityMultipliers, totalPot } = params;

    // Calculate total bets for point-based wagering
    const totalPointsBet = questionVotes.reduce((sum, v) => sum + parseFloat(v.betAmount), 0);
    const winningVotes = questionVotes.filter(v => v.choice === winningChoice && parseFloat(v.betAmount) > 0);
    const totalWinningBets = winningVotes.reduce((sum, v) => sum + parseFloat(v.betAmount), 0);

    // Use a database transaction to ensure atomicity
    await db.transaction(async (tx) => {
      for (const vote of questionVotes) {
        const rarityMultiplier = rarityMultipliers[vote.choice] || 1;
        const publicMultiplier = vote.isPublic ? 2 : 1;
        const basePoints = 100;
        const totalMultiplier = rarityMultiplier * publicMultiplier;
        const points = basePoints * totalMultiplier;

        const betAmount = parseFloat(vote.betAmount);
        const isWinner = vote.choice === winningChoice;
        const isSecondPlace = secondPlaceChoice && vote.choice === secondPlaceChoice;

        // Calculate payout based on points betting
        let payout = 0;
        if (isWinner && betAmount > 0 && totalWinningBets > 0) {
          // Winners get proportional share of the total pot
          payout = (totalPointsBet * betAmount) / totalWinningBets;
        } else if (isSecondPlace && betAmount > 0) {
          // 2nd place gets 25% of their bet back as consolation
          payout = betAmount * 0.25;
        }
        // Everyone else loses their bet (payout = 0)

        // Update user's alpha points
        const [currentUser] = await tx
          .select()
          .from(users)
          .where(eq(users.id, vote.userId))
          .limit(1);

        if (currentUser) {
          await tx
            .update(users)
            .set({
              alphaPoints: currentUser.alphaPoints + points,
              updatedAt: new Date()
            })
            .where(eq(users.id, vote.userId));
        }

        // Update vote record with results
        await tx
          .update(votes)
          .set({
            pointsEarned: points,
            multiplier: totalMultiplier,
            payout: payout.toFixed(2),
            isCorrect: isWinner,
          })
          .where(eq(votes.id, vote.id));
      }
    });
  }

  // Process question results and distribute payouts
  async processQuestionResults(questionId: string, correctAnswer: VoteChoice): Promise<void> {
    // Get all bets for this question
    const allVotes = await this.getQuestionVotes(questionId);

    // Calculate total pot and winning pot
    let totalPot = 0;
    let winningPot = 0;

    for (const vote of allVotes) {
      const amount = parseFloat(vote.betAmount);
      totalPot += amount;
      if (vote.choice === correctAnswer) {
        winningPot += amount;
      }
    }

    // Process each vote
    for (const vote of allVotes) {
      const isCorrect = vote.choice === correctAnswer;
      const betAmount = parseFloat(vote.betAmount);
      let payout = 0;

      if (isCorrect && winningPot > 0) {
        // Winner gets proportional share of total pot
        payout = (betAmount / winningPot) * totalPot;
      }

      // Update vote record
      await this.updateVote(vote.id, {
        isCorrect,
        payout: payout.toFixed(2),
      });

      // Update user balance and stats
      const user = await this.getUser(vote.userId);
      if (user) {
        const updates: Partial<User> = {
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

    // Mark question as revealed with correct answer
    await this.updateQuestion(questionId, {
      isRevealed: true,
      isActive: false,
      correctAnswer,
    });
  }

  // Account linking operations
  async createLinkToken(data: InsertAccountLinkToken): Promise<AccountLinkToken> {
    const [token] = await db.insert(accountLinkTokens).values([data]).returning();
    return token;
  }

  async getLinkToken(token: string): Promise<AccountLinkToken | undefined> {
    const [linkToken] = await db
      .select()
      .from(accountLinkTokens)
      .where(eq(accountLinkTokens.token, token))
      .limit(1);
    return linkToken;
  }

  async claimLinkToken(token: string, userId: string): Promise<AccountLinkToken | undefined> {
    const [linkToken] = await db
      .update(accountLinkTokens)
      .set({
        claimedByUserId: userId,
        claimedAt: new Date(),
      })
      .where(
        and(
          eq(accountLinkTokens.token, token),
          isNull(accountLinkTokens.claimedAt)
        )
      )
      .returning();
    return linkToken;
  }

  async cleanupExpiredTokens(): Promise<void> {
    const now = new Date();
    await db
      .delete(accountLinkTokens)
      .where(
        and(
          lt(accountLinkTokens.expiresAt, now),
          isNull(accountLinkTokens.claimedAt)
        )
      );
  }

  // Leaderboard operations - unified across all platforms
  async getUnifiedLeaderboard(limit: number = 50): Promise<LeaderboardEntry[]> {
    // Get users ordered by balance (virtual currency)
    const allUsers = await db
      .select()
      .from(users)
      .orderBy(desc(users.balance), desc(users.currentStreak))
      .limit(limit);

    // Calculate accuracy for each user
    const usersWithAccuracy = allUsers.map(user => {
      const accuracy = user.totalPredictions > 0
        ? Math.round((user.correctPredictions / user.totalPredictions) * 100)
        : 0;
      return { ...user, accuracy };
    });

    return usersWithAccuracy;
  }

  // Legacy leaderboard (alphaPoints-based)
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
