/**
 * Telegram Storage Wrapper
 *
 * This module wraps the unified storage layer to provide Telegram-specific
 * functionality while using the unified users, questions, and votes tables.
 */

import { storage, type QuestionStats } from './storage';
import type { User, Question, Vote, VoteChoice } from '@shared/schema';

export interface TelegramQuestionWithStats extends Question {
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

  async getUser(id: string): Promise<User | undefined> {
    return storage.getUser(id);
  }

  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    return storage.getUserByTelegramId(telegramId);
  }

  async createUser(data: {
    telegramId: string;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  }): Promise<User> {
    return storage.createUserFromTelegram({
      telegramId: data.telegramId,
      telegramUsername: data.username,
      firstName: data.firstName,
      lastName: data.lastName,
      primaryPlatform: 'telegram',
    });
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    return storage.updateUser(id, updates);
  }

  async updateUserBalance(id: string, amount: number): Promise<User | undefined> {
    return storage.updateUserBalance(id, amount);
  }

  async getAllUsers(): Promise<User[]> {
    // Get all users who have a telegram ID (registered via Telegram)
    const allUsers = await storage.getAllUsers();
    return allUsers.filter(u => u.telegramId !== null);
  }

  async getLeaderboard(limit: number = 20): Promise<User[]> {
    // Get unified leaderboard (all platforms)
    const leaders = await storage.getUnifiedLeaderboard(limit);
    return leaders;
  }

  // ===== QUESTION OPERATIONS =====

  async getQuestion(id: string): Promise<Question | undefined> {
    return storage.getQuestion(id);
  }

  async getActiveQuestion(): Promise<Question | undefined> {
    const activeQuestions = await storage.getActiveQuestions();
    // Return the most recent active question
    return activeQuestions.length > 0 ? activeQuestions[0] : undefined;
  }

  async getQuestionsDueToSend(): Promise<Question[]> {
    return storage.getQuestionsDueToBroadcast();
  }

  async getQuestionsToReveal(): Promise<Question[]> {
    return storage.getQuestionsToReveal();
  }

  async getUnsentResults(): Promise<Question[]> {
    return storage.getUnsentResults();
  }

  async getAllQuestions(): Promise<Question[]> {
    return storage.getAllQuestions();
  }

  async getUpcomingQuestions(): Promise<Question[]> {
    const all = await storage.getAllQuestions();
    const now = new Date();
    return all.filter(q => q.dropsAt > now).sort((a, b) => a.dropsAt.getTime() - b.dropsAt.getTime());
  }

  async getPastQuestions(limit: number = 10): Promise<Question[]> {
    return storage.getRevealedQuestions(limit);
  }

  async createQuestion(data: {
    prompt: string;
    optionA: string;
    optionB: string;
    optionC?: string | null;
    optionD?: string | null;
    context?: string | null;
    scheduledFor: Date;
    expiresAt: Date;
  }): Promise<Question> {
    return storage.createQuestion({
      type: 'prediction',
      prompt: data.prompt,
      optionA: data.optionA,
      optionB: data.optionB,
      optionC: data.optionC,
      optionD: data.optionD,
      context: data.context,
      dropsAt: data.scheduledFor,
      revealsAt: data.expiresAt,
      isActive: false,
      isRevealed: false,
    });
  }

  async updateQuestion(id: string, updates: Partial<Question>): Promise<Question | undefined> {
    return storage.updateQuestion(id, updates);
  }

  async deleteQuestion(id: string): Promise<void> {
    return storage.deleteQuestion(id);
  }

  async activateQuestion(id: string): Promise<Question | undefined> {
    return storage.updateQuestion(id, {
      isActive: true,
      telegramBroadcastedAt: new Date(),
    });
  }

  async revealQuestion(id: string, correctAnswer: VoteChoice): Promise<Question | undefined> {
    return storage.updateQuestion(id, {
      isActive: false,
      isRevealed: true,
      correctAnswer,
    });
  }

  async markResultsSent(id: string): Promise<Question | undefined> {
    return storage.updateQuestion(id, {
      telegramResultsSentAt: new Date(),
    });
  }

  // ===== BET/VOTE OPERATIONS =====

  async getBet(userId: string, questionId: string): Promise<Vote | undefined> {
    return storage.getVote(userId, questionId);
  }

  async getUserBets(userId: string): Promise<Vote[]> {
    return storage.getUserVotes(userId);
  }

  async getQuestionBets(questionId: string): Promise<Vote[]> {
    return storage.getQuestionVotes(questionId);
  }

  async createBet(data: {
    userId: string;
    questionId: string;
    choice: VoteChoice;
    betAmount: string;
  }): Promise<Vote> {
    const betAmount = parseFloat(data.betAmount);
    return storage.createVoteWithBet({
      userId: data.userId,
      questionId: data.questionId,
      choice: data.choice,
      betAmount,
      platform: 'telegram',
    });
  }

  async updateBet(id: string, updates: Partial<Vote>): Promise<Vote | undefined> {
    return storage.updateVote(id, updates);
  }

  async getQuestionStats(questionId: string): Promise<QuestionStats> {
    return storage.getQuestionStats(questionId);
  }

  // ===== RESULTS PROCESSING =====

  async processQuestionResults(questionId: string, correctAnswer: VoteChoice): Promise<void> {
    return storage.processQuestionResults(questionId, correctAnswer);
  }
}

export const telegramStorage = new TelegramStorage();
