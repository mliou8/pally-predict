import type { Express, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { telegramStorage } from './telegram-storage';
import { broadcastQuestion, broadcastResults } from './telegram-bot';
import { forceProcessTasks } from './telegram-scheduler';
import { storage } from './storage';
import { z } from 'zod';

// Validate Telegram Web App init data
function validateTelegramInitData(initData: string, botToken: string): { valid: boolean; data: any } {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');

    // Sort and stringify the params
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Generate secret key
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();

    // Generate hash
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (calculatedHash !== hash) {
      return { valid: false, data: null };
    }

    // Parse user data
    const userStr = urlParams.get('user');
    const user = userStr ? JSON.parse(userStr) : null;

    return {
      valid: true,
      data: {
        user,
        authDate: urlParams.get('auth_date'),
        queryId: urlParams.get('query_id'),
        startParam: urlParams.get('start_param'),
      },
    };
  } catch (error) {
    console.error('Error validating Telegram init data:', error);
    return { valid: false, data: null };
  }
}

// Middleware to authenticate Telegram Mini App requests
function telegramAuth(req: Request, res: Response, next: NextFunction) {
  const initData = req.header('X-Telegram-Init-Data') || '';
  const botToken = process.env.TELEGRAM_BOT_TOKEN || '';

  if (!initData) {
    return res.status(401).json({ error: 'Missing Telegram init data' });
  }

  // In development, skip validation if no bot token
  if (!botToken && process.env.NODE_ENV !== 'production') {
    // Try to parse user from init data even without validation
    try {
      const urlParams = new URLSearchParams(initData);
      const userStr = urlParams.get('user');
      const user = userStr ? JSON.parse(userStr) : null;
      (req as any).telegramUser = user;
      return next();
    } catch (e) {
      return res.status(401).json({ error: 'Invalid Telegram init data format' });
    }
  }

  const { valid, data } = validateTelegramInitData(initData, botToken);

  if (!valid) {
    return res.status(401).json({ error: 'Invalid Telegram authentication' });
  }

  (req as any).telegramUser = data.user;
  (req as any).telegramData = data;
  next();
}

// Schema for creating telegram questions via admin API
const createTelegramQuestionSchema = z.object({
  prompt: z.string().min(1),
  optionA: z.string().min(1),
  optionB: z.string().min(1),
  optionC: z.string().optional().nullable(),
  optionD: z.string().optional().nullable(),
  context: z.string().optional().nullable(),
  scheduledFor: z.string().transform((str) => new Date(str)),
  expiresAt: z.string().transform((str) => new Date(str)),
});

export function registerTelegramRoutes(app: Express): void {
  // ===== ADMIN AUTHENTICATION =====
  // Admin key authentication - required in production
  const ADMIN_KEY = process.env.TELEGRAM_ADMIN_KEY;
  if (!ADMIN_KEY) {
    console.warn('WARNING: TELEGRAM_ADMIN_KEY not set. Admin routes will be disabled.');
  }

  const requireAdminAuth = (req: any, res: any, next: any) => {
    // Only accept admin key from headers, not query params (security best practice)
    const adminKey = req.header('x-admin-key');

    if (!ADMIN_KEY) {
      return res.status(500).json({ error: 'Admin authentication not configured' });
    }

    if (!adminKey) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Use timing-safe comparison to prevent timing attacks
    try {
      const adminKeyBuffer = Buffer.from(ADMIN_KEY);
      const providedKeyBuffer = Buffer.from(adminKey);

      if (adminKeyBuffer.length !== providedKeyBuffer.length ||
          !crypto.timingSafeEqual(adminKeyBuffer, providedKeyBuffer)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    } catch {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    next();
  };

  // ===== QUESTION MANAGEMENT =====
  
  // Get all questions
  app.get('/api/telegram/admin/questions', requireAdminAuth, async (req, res) => {
    try {
      const questions = await telegramStorage.getAllQuestions();
      
      // Add stats for each question
      const questionsWithStats = await Promise.all(
        questions.map(async (q) => {
          const stats = await telegramStorage.getQuestionStats(q.id);
          return { ...q, stats };
        })
      );
      
      res.json(questionsWithStats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get single question with stats
  app.get('/api/telegram/admin/questions/:id', requireAdminAuth, async (req, res) => {
    try {
      const question = await telegramStorage.getQuestion(req.params.id);
      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }
      
      const stats = await telegramStorage.getQuestionStats(question.id);
      const bets = await telegramStorage.getQuestionBets(question.id);
      
      res.json({ question, stats, bets });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create new question
  app.post('/api/telegram/admin/questions', requireAdminAuth, async (req, res) => {
    try {
      const questionData = createTelegramQuestionSchema.parse(req.body);
      const question = await telegramStorage.createQuestion(questionData);
      res.status(201).json(question);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update question
  app.patch('/api/telegram/admin/questions/:id', requireAdminAuth, async (req, res) => {
    try {
      const question = await telegramStorage.getQuestion(req.params.id);
      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }
      
      const updates = req.body;
      
      // Convert date strings to Date objects if present
      if (updates.scheduledFor) {
        updates.scheduledFor = new Date(updates.scheduledFor);
      }
      if (updates.expiresAt) {
        updates.expiresAt = new Date(updates.expiresAt);
      }
      
      const updated = await telegramStorage.updateQuestion(req.params.id, updates);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Delete question
  app.delete('/api/telegram/admin/questions/:id', requireAdminAuth, async (req, res) => {
    try {
      const question = await telegramStorage.getQuestion(req.params.id);
      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }
      
      // Don't allow deleting questions that have bets
      const bets = await telegramStorage.getQuestionBets(req.params.id);
      if (bets.length > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete question with existing bets',
          betCount: bets.length 
        });
      }
      
      await telegramStorage.deleteQuestion(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===== QUESTION ACTIONS =====
  
  // Manually activate a question (send to users)
  app.post('/api/telegram/admin/questions/:id/activate', requireAdminAuth, async (req, res) => {
    try {
      const question = await telegramStorage.getQuestion(req.params.id);
      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }
      
      if (question.isActive) {
        return res.status(400).json({ error: 'Question is already active' });
      }
      
      if (question.isRevealed) {
        return res.status(400).json({ error: 'Question has already been revealed' });
      }
      
      // Activate and broadcast
      await telegramStorage.activateQuestion(question.id);
      const sentCount = await broadcastQuestion(question);
      
      res.json({ 
        success: true, 
        message: `Question activated and sent to ${sentCount} users` 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Set correct answer and reveal results
  app.post('/api/telegram/admin/questions/:id/reveal', requireAdminAuth, async (req, res) => {
    try {
      const { correctAnswer } = req.body;
      
      if (!correctAnswer || !['A', 'B', 'C', 'D'].includes(correctAnswer)) {
        return res.status(400).json({ error: 'Valid correctAnswer (A, B, C, or D) is required' });
      }
      
      const question = await telegramStorage.getQuestion(req.params.id);
      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }
      
      if (question.isRevealed) {
        return res.status(400).json({ error: 'Question has already been revealed' });
      }
      
      // Process results
      await telegramStorage.processQuestionResults(question.id, correctAnswer);
      
      // Send results to users
      const sentCount = await broadcastResults({ ...question, correctAnswer, isRevealed: true });
      
      // Mark as sent
      await telegramStorage.markResultsSent(question.id);
      
      res.json({ 
        success: true, 
        message: `Results processed and sent to ${sentCount} users`,
        correctAnswer,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===== USER MANAGEMENT =====
  
  // Get all users
  app.get('/api/telegram/admin/users', requireAdminAuth, async (req, res) => {
    try {
      const users = await telegramStorage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get leaderboard
  app.get('/api/telegram/admin/leaderboard', requireAdminAuth, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const users = await telegramStorage.getLeaderboard(limit);
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Reset user balance (for testing)
  app.post('/api/telegram/admin/users/:id/reset-balance', requireAdminAuth, async (req, res) => {
    try {
      const { balance = '500.00' } = req.body;
      const user = await telegramStorage.updateUser(req.params.id, { 
        balance: balance.toString(),
        totalWagered: '0.00',
        totalWon: '0.00',
        correctPredictions: 0,
        totalPredictions: 0,
        currentStreak: 0,
      });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===== SCHEDULER CONTROL =====
  
  // Force process scheduled tasks
  app.post('/api/telegram/admin/scheduler/run', requireAdminAuth, async (req, res) => {
    try {
      const results = await forceProcessTasks();
      res.json({ success: true, ...results });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===== STATS =====

  // Get dashboard stats
  app.get('/api/telegram/admin/stats', requireAdminAuth, async (req, res) => {
    try {
      const users = await telegramStorage.getAllUsers();
      const questions = await telegramStorage.getAllQuestions();
      const activeQuestion = await telegramStorage.getActiveQuestion();

      const totalBalance = users.reduce((sum, u) => sum + parseFloat(u.balance), 0);
      const totalWagered = users.reduce((sum, u) => sum + parseFloat(u.totalWagered), 0);

      res.json({
        totalUsers: users.length,
        totalQuestions: questions.length,
        activeQuestions: questions.filter(q => q.isActive && !q.isRevealed).length,
        revealedQuestions: questions.filter(q => q.isRevealed).length,
        pendingQuestions: questions.filter(q => !q.isActive && !q.isRevealed).length,
        currentActiveQuestion: activeQuestion?.id || null,
        totalBalance: totalBalance.toFixed(2),
        totalWagered: totalWagered.toFixed(2),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // TELEGRAM MINI APP ROUTES (User-facing)
  // ============================================

  // Get or create user from Telegram auth
  app.get('/api/telegram/user', telegramAuth, async (req, res) => {
    try {
      const telegramUser = (req as any).telegramUser;
      if (!telegramUser?.id) {
        return res.status(400).json({ error: 'Invalid Telegram user data' });
      }

      const telegramId = telegramUser.id.toString();
      let user = await telegramStorage.getUserByTelegramId(telegramId);

      // Auto-register if user doesn't exist
      if (!user) {
        user = await telegramStorage.createUser({
          telegramId,
          username: telegramUser.username || null,
          firstName: telegramUser.first_name || null,
          lastName: telegramUser.last_name || null,
        });
      }

      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get active question for Mini App
  app.get('/api/telegram/question/active', telegramAuth, async (req, res) => {
    try {
      const question = await telegramStorage.getActiveQuestion();
      if (!question) {
        return res.status(404).json({ error: 'No active question' });
      }

      // Map to expected format
      res.json({
        id: question.id,
        prompt: question.prompt,
        optionA: question.optionA,
        optionB: question.optionB,
        optionC: question.optionC,
        optionD: question.optionD,
        context: question.context,
        type: 'PREDICTION',
        revealsAt: question.revealsAt,
        isActive: question.isActive,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get revealed question (most recent)
  app.get('/api/telegram/question/revealed', telegramAuth, async (req, res) => {
    try {
      const questions = await telegramStorage.getAllQuestions();
      const revealed = questions
        .filter(q => q.isRevealed)
        .sort((a, b) => new Date(b.revealsAt).getTime() - new Date(a.revealsAt).getTime())[0];

      if (!revealed) {
        return res.status(404).json({ error: 'No revealed questions' });
      }

      res.json({
        id: revealed.id,
        prompt: revealed.prompt,
        optionA: revealed.optionA,
        optionB: revealed.optionB,
        optionC: revealed.optionC,
        optionD: revealed.optionD,
        context: revealed.context,
        type: 'PREDICTION',
        revealsAt: revealed.revealsAt,
        correctAnswer: revealed.correctAnswer,
        isRevealed: revealed.isRevealed,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get question stats
  app.get('/api/telegram/question/:id/stats', telegramAuth, async (req, res) => {
    try {
      const stats = await telegramStorage.getQuestionStats(req.params.id);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get user's bet for a question
  app.get('/api/telegram/bet/:questionId', telegramAuth, async (req, res) => {
    try {
      const telegramUser = (req as any).telegramUser;
      const telegramId = telegramUser.id.toString();
      const user = await telegramStorage.getUserByTelegramId(telegramId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const bet = await telegramStorage.getBet(user.id, req.params.questionId);
      if (!bet) {
        return res.status(404).json({ error: 'No bet found' });
      }

      res.json(bet);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Place a bet
  app.post('/api/telegram/bet', telegramAuth, async (req, res) => {
    try {
      const telegramUser = (req as any).telegramUser;
      const telegramId = telegramUser.id.toString();
      const { questionId, choice, betAmount } = req.body;

      if (!questionId || !choice || !betAmount) {
        return res.status(400).json({ error: 'questionId, choice, and betAmount are required' });
      }

      if (!['A', 'B', 'C', 'D'].includes(choice)) {
        return res.status(400).json({ error: 'Invalid choice' });
      }

      const amount = parseFloat(betAmount);
      if (isNaN(amount) || amount < 1) {
        return res.status(400).json({ error: 'Minimum bet is $1' });
      }

      const user = await telegramStorage.getUserByTelegramId(telegramId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const balance = parseFloat(user.balance);
      if (amount > balance) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      const question = await telegramStorage.getQuestion(questionId);
      if (!question || !question.isActive) {
        return res.status(400).json({ error: 'Question is not active' });
      }

      // Check if already bet
      const existingBet = await telegramStorage.getBet(user.id, questionId);
      if (existingBet) {
        return res.status(400).json({ error: 'Already placed a bet on this question' });
      }

      // Deduct from balance
      await telegramStorage.updateUser(user.id, {
        balance: (balance - amount).toFixed(2),
        totalWagered: (parseFloat(user.totalWagered) + amount).toFixed(2),
      });

      // Create bet
      const bet = await telegramStorage.createBet({
        userId: user.id,
        questionId,
        choice,
        betAmount: amount.toFixed(2),
      });

      res.json(bet);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get leaderboard for Mini App
  app.get('/api/telegram/leaderboard', telegramAuth, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const leaders = await telegramStorage.getLeaderboard(limit);
      res.json(leaders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get user's recent bets
  app.get('/api/telegram/bets/recent', telegramAuth, async (req, res) => {
    try {
      const telegramUser = (req as any).telegramUser;
      const telegramId = telegramUser.id.toString();
      const user = await telegramStorage.getUserByTelegramId(telegramId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const bets = await telegramStorage.getUserBets(user.id);

      // Add question prompts to bets
      const betsWithQuestions = await Promise.all(
        bets.slice(0, 10).map(async (bet) => {
          const question = await telegramStorage.getQuestion(bet.questionId);
          return {
            ...bet,
            questionPrompt: question?.prompt || 'Unknown question',
          };
        })
      );

      res.json(betsWithQuestions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}

