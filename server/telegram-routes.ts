import type { Express } from 'express';
import { telegramStorage } from './telegram-storage';
import { broadcastQuestion, broadcastResults } from './telegram-bot';
import { forceProcessTasks } from './telegram-scheduler';
import { insertTelegramQuestionSchema } from '@shared/telegram-schema';

export function registerTelegramRoutes(app: Express): void {
  // ===== ADMIN AUTHENTICATION =====
  // Simple admin key authentication for now
  const requireAdminAuth = (req: any, res: any, next: any) => {
    const adminKey = req.header('x-admin-key') || req.query.adminKey;
    const expectedKey = process.env.TELEGRAM_ADMIN_KEY || 'pally-admin-2024';
    
    if (adminKey !== expectedKey) {
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
      const questionData = insertTelegramQuestionSchema.parse(req.body);
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
}

