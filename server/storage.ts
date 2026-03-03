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
  getRecentPublicVotes(limit: number, questionId?: string): Promise<Vote[]>;
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
  getLeaderboardByPeriod(limit?: number, sinceDate?: Date | null): Promise<LeaderboardEntry[]>;
  getPPLeaderboard(limit?: number): Promise<LeaderboardEntry[]>;
  getEarningsLeaderboard(limit?: number): Promise<LeaderboardEntry[]>;
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
    // Use atomic SQL update to prevent race conditions
    const [user] = await db
      .update(users)
      .set({
        balance: sql`(${users.balance}::numeric + ${delta})::numeric(12,2)`,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
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

  async getRecentPublicVotes(limit: number, questionId?: string): Promise<Vote[]> {
    const conditions = [eq(votes.isPublic, true)];
    if (questionId) {
      conditions.push(eq(votes.questionId, questionId));
    }

    return await db
      .select()
      .from(votes)
      .where(and(...conditions))
      .orderBy(desc(votes.votedAt))
      .limit(limit);
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
    // Use a database transaction to ensure atomicity and prevent race conditions
    const result = await db.transaction(async (tx) => {
      // Get current user balance
      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.id, data.userId))
        .limit(1);

      if (!user) {
        throw new Error('User not found');
      }

      const currentBalance = parseFloat(user.balance);
      if (data.betAmount > currentBalance) {
        throw new Error('Insufficient balance');
      }

      // Atomically update user balance and totalWagered using SQL expressions
      // This prevents race conditions even without explicit row locking
      const newBalance = (currentBalance - data.betAmount).toFixed(2);
      const newWagered = (parseFloat(user.totalWagered) + data.betAmount).toFixed(2);

      await tx
        .update(users)
        .set({
          balance: newBalance,
          totalWagered: newWagered,
          updatedAt: new Date()
        })
        .where(eq(users.id, data.userId));

      // Create the vote
      const insertResult = await tx.insert(votes).values([{
        userId: data.userId,
        questionId: data.questionId,
        choice: data.choice,
        betAmount: data.betAmount.toFixed(2),
        platform: data.platform,
        isPublic: true,
      }]).returning();

      return insertResult[0];
    });

    // Broadcast pool update via WebSocket (outside transaction)
    broadcastPoolUpdate(data.questionId).catch(err =>
      console.error('Error broadcasting pool update:', err)
    );

    return result;
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
  // Points-based system:
  // - 1st place (winner): gets pot share
  // - 2nd place: 25% of bet back + bonus points
  // - 3rd place: 15% of bet back + bonus points
  // - 4th place: 10% of bet back + bonus points
  async distributeRewards(params: {
    questionVotes: Vote[];
    winningChoice: VoteChoice;
    secondPlaceChoice: VoteChoice | null;
    thirdPlaceChoice?: VoteChoice | null;
    fourthPlaceChoice?: VoteChoice | null;
    totalPot: bigint;
  }): Promise<void> {
    const { questionVotes, winningChoice, secondPlaceChoice, thirdPlaceChoice, fourthPlaceChoice, totalPot } = params;

    // Calculate total bets for point-based wagering
    const totalPointsBet = questionVotes.reduce((sum, v) => sum + parseFloat(v.betAmount), 0);
    const winningVotes = questionVotes.filter(v => v.choice === winningChoice && parseFloat(v.betAmount) > 0);
    const totalWinningBets = winningVotes.reduce((sum, v) => sum + parseFloat(v.betAmount), 0);

    // Use a database transaction to ensure atomicity
    await db.transaction(async (tx) => {
      for (const vote of questionVotes) {
        // Consensus game: no rarity multiplier since winner = majority pick
        const publicMultiplier = vote.isPublic ? 2 : 1;
        let basePoints = 100;

        const betAmount = parseFloat(vote.betAmount);
        const isWinner = vote.choice === winningChoice;
        const isSecondPlace = secondPlaceChoice && vote.choice === secondPlaceChoice;
        const isThirdPlace = thirdPlaceChoice && vote.choice === thirdPlaceChoice;
        const isFourthPlace = fourthPlaceChoice && vote.choice === fourthPlaceChoice;

        // Bonus points for placing (even if not winner)
        if (isWinner) {
          basePoints = 100; // Winner base
        } else if (isSecondPlace) {
          basePoints = 75; // 2nd place bonus
        } else if (isThirdPlace) {
          basePoints = 50; // 3rd place bonus
        } else if (isFourthPlace) {
          basePoints = 25; // 4th place bonus
        } else {
          basePoints = 10; // Participation points
        }

        const totalMultiplier = publicMultiplier;
        const points = basePoints * totalMultiplier;

        // Calculate payout based on placement
        let payout = 0;
        if (isWinner && betAmount > 0 && totalWinningBets > 0) {
          // Winners get proportional share of the total pot
          payout = (totalPointsBet * betAmount) / totalWinningBets;
        } else if (isSecondPlace && betAmount > 0) {
          // 2nd place gets 25% of their bet back as consolation
          payout = betAmount * 0.25;
        } else if (isThirdPlace && betAmount > 0) {
          // 3rd place gets 15% of their bet back
          payout = betAmount * 0.15;
        } else if (isFourthPlace && betAmount > 0) {
          // 4th place gets 10% of their bet back
          payout = betAmount * 0.10;
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

  // Claim rewards for a consensus question (majority wins)
  async claimVoteRewards(voteId: string, userId: string): Promise<{ success: boolean; payout: number; message: string }> {
    // Get the vote
    const [vote] = await db
      .select()
      .from(votes)
      .where(and(eq(votes.id, voteId), eq(votes.userId, userId)))
      .limit(1);

    if (!vote) {
      return { success: false, payout: 0, message: 'Vote not found' };
    }

    // Check if already claimed (payout is set and > 0 means already processed)
    if (vote.payout && parseFloat(vote.payout) > 0) {
      return { success: false, payout: parseFloat(vote.payout), message: 'Rewards already claimed' };
    }

    // Get the question
    const question = await this.getQuestion(vote.questionId);
    if (!question) {
      return { success: false, payout: 0, message: 'Question not found' };
    }

    // Question must be revealed
    if (!question.isRevealed) {
      return { success: false, payout: 0, message: 'Results not revealed yet' };
    }

    // Get results to determine majority winner
    const results = await this.getQuestionResults(vote.questionId);
    if (!results) {
      return { success: false, payout: 0, message: 'Results not available' };
    }

    // Determine winning choice (majority)
    const percentages = [
      { choice: 'A' as VoteChoice, percent: results.percentA },
      { choice: 'B' as VoteChoice, percent: results.percentB },
      { choice: 'C' as VoteChoice, percent: results.percentC || 0 },
      { choice: 'D' as VoteChoice, percent: results.percentD || 0 },
    ];
    const sorted = [...percentages].sort((a, b) => b.percent - a.percent);
    const winningChoice = sorted[0].choice;

    const isCorrect = vote.choice === winningChoice;
    const betAmount = parseFloat(vote.betAmount);

    if (!isCorrect) {
      // User lost - mark as processed with 0 payout
      await this.updateVote(vote.id, {
        isCorrect: false,
        payout: '0.00',
      });
      return { success: true, payout: 0, message: 'You did not pick the majority choice' };
    }

    // Calculate payout for winner
    // Get all bets for this question
    const allVotes = await this.getQuestionVotes(vote.questionId);
    let totalPot = 0;
    let winningPot = 0;

    for (const v of allVotes) {
      const amount = parseFloat(v.betAmount);
      totalPot += amount;
      if (v.choice === winningChoice) {
        winningPot += amount;
      }
    }

    // Winner gets proportional share of total pot
    const payout = winningPot > 0 ? (betAmount / winningPot) * totalPot : betAmount;

    // Update vote record
    await this.updateVote(vote.id, {
      isCorrect: true,
      payout: payout.toFixed(2),
    });

    // Update user balance
    const user = await this.getUser(userId);
    if (user) {
      await this.updateUser(userId, {
        totalPredictions: user.totalPredictions + 1,
        correctPredictions: user.correctPredictions + 1,
        currentStreak: user.currentStreak + 1,
        maxStreak: Math.max(user.maxStreak, user.currentStreak + 1),
        totalWon: (parseFloat(user.totalWon) + payout).toFixed(2),
        balance: (parseFloat(user.balance) + payout).toFixed(2),
      });
    }

    return { success: true, payout, message: `Claimed ${payout.toFixed(2)} WP` };
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

  // Leaderboard by time period - includes ALL users, ranked by WP (balance)
  async getLeaderboardByPeriod(limit: number = 50, sinceDate: Date | null = null): Promise<LeaderboardEntry[]> {
    let allUsers;

    if (sinceDate) {
      // For weekly/monthly: get users who signed up OR voted since the date
      // First, get user IDs who voted in this period
      const recentVoterIds = await db
        .selectDistinct({ userId: votes.userId })
        .from(votes)
        .where(gte(votes.votedAt, sinceDate));

      const voterIdSet = new Set(recentVoterIds.map(v => v.userId));

      // Get all users, then filter to those who signed up recently OR voted recently
      const allUsersRaw = await db
        .select()
        .from(users)
        .orderBy(desc(users.balance), desc(users.createdAt));

      allUsers = allUsersRaw.filter(user =>
        user.createdAt >= sinceDate || voterIdSet.has(user.id)
      ).slice(0, limit);
    } else {
      // All time: just get everyone sorted by WP (balance)
      allUsers = await db
        .select()
        .from(users)
        .orderBy(desc(users.balance), desc(users.createdAt))
        .limit(limit);
    }

    // Return with basic accuracy calculation
    const usersWithAccuracy = allUsers.map((user) => ({
      ...user,
      accuracy: user.totalPredictions > 0
        ? Math.round((user.correctPredictions / user.totalPredictions) * 100)
        : 0,
    }));

    return usersWithAccuracy;
  }

  // PP (Pally Points) leaderboard - sorted by pallyPoints
  async getPPLeaderboard(limit: number = 50): Promise<LeaderboardEntry[]> {
    const allUsers = await db
      .select()
      .from(users)
      .orderBy(desc(users.pallyPoints), desc(users.currentStreak))
      .limit(limit);

    // Return with basic accuracy (simplified for PP leaderboard)
    const usersWithAccuracy = allUsers.map((user) => ({
      ...user,
      accuracy: user.totalPredictions > 0
        ? Math.round((user.correctPredictions / user.totalPredictions) * 100)
        : 0,
    }));

    return usersWithAccuracy;
  }

  // Earnings leaderboard (sorted by total winnings)
  async getEarningsLeaderboard(limit: number = 50): Promise<LeaderboardEntry[]> {
    const allUsers = await db
      .select()
      .from(users)
      .orderBy(desc(users.totalWon), desc(users.alphaPoints))
      .limit(limit);

    // Return with accuracy calculated same as regular leaderboard
    const allResults = await db
      .select()
      .from(questionResults)
      .innerJoin(questions, eq(questionResults.questionId, questions.id))
      .where(eq(questions.isRevealed, true));

    const resultsMap = new Map<string, QuestionResults>();
    for (const row of allResults) {
      resultsMap.set(row.question_results.questionId, row.question_results);
    }

    const usersWithAccuracy = await Promise.all(
      allUsers.map(async (user) => {
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

        let correctVotes = 0;
        let votesWithResults = 0;

        for (const vote of userVotesQuery) {
          const results = resultsMap.get(vote.questionId);
          if (!results) continue;

          votesWithResults++;

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
