import type { Express } from 'express';
import { createServer, type Server } from 'http';
import { storage } from './storage';
import { insertUserSchema, insertQuestionSchema, insertVoteSchema } from '@shared/schema';

export async function registerRoutes(app: Express): Promise<Server> {
  // ===== USER ROUTES =====
  
  // Get current user by Privy ID
  app.get('/api/user/me', async (req, res) => {
    try {
      const privyUserId = req.header('x-privy-user-id');
      if (!privyUserId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await storage.getUserByPrivyId(privyUserId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create user profile
  app.post('/api/user/profile', async (req, res) => {
    try {
      const privyUserId = req.header('x-privy-user-id');
      if (!privyUserId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { handle } = req.body;
      if (!handle) {
        return res.status(400).json({ error: 'Handle is required' });
      }

      // Check if handle is already taken
      const existing = await storage.getUserByHandle(handle);
      if (existing) {
        return res.status(400).json({ error: 'Handle already taken' });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByPrivyId(privyUserId);
      if (existingUser) {
        return res.status(400).json({ error: 'User already has a profile' });
      }

      const userData = insertUserSchema.parse({ privyUserId, handle });
      const user = await storage.createUser(userData);

      res.status(201).json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update user profile
  app.patch('/api/user/profile', async (req, res) => {
    try {
      const privyUserId = req.header('x-privy-user-id');
      if (!privyUserId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await storage.getUserByPrivyId(privyUserId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const updates = req.body;
      const updatedUser = await storage.updateUser(user.id, updates);

      res.json(updatedUser);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===== QUESTION ROUTES =====
  
  // Get active questions (voting open)
  app.get('/api/questions/active', async (req, res) => {
    try {
      const questions = await storage.getActiveQuestions();
      res.json(questions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get revealed questions (results available)
  app.get('/api/questions/revealed', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const questions = await storage.getRevealedQuestions(limit);
      res.json(questions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get question by ID
  app.get('/api/questions/:id', async (req, res) => {
    try {
      const question = await storage.getQuestion(req.params.id);
      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }
      res.json(question);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create question (admin only - no auth check for now)
  app.post('/api/questions', async (req, res) => {
    try {
      const questionData = insertQuestionSchema.parse(req.body);
      const question = await storage.createQuestion(questionData);
      res.status(201).json(question);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ===== VOTE ROUTES =====
  
  // Submit a vote
  app.post('/api/votes', async (req, res) => {
    try {
      const privyUserId = req.header('x-privy-user-id');
      if (!privyUserId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await storage.getUserByPrivyId(privyUserId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { questionId, choice, isPublic = true } = req.body;

      // Check if question exists and is active
      const question = await storage.getQuestion(questionId);
      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }

      if (!question.isActive || question.isRevealed) {
        return res.status(400).json({ error: 'Question is not open for voting' });
      }

      // Check if user has already voted on this question
      const existingVote = await storage.getVote(user.id, questionId);
      if (existingVote) {
        return res.status(400).json({ error: 'Already voted on this question' });
      }

      // Create the vote
      const voteData = insertVoteSchema.parse({
        userId: user.id,
        questionId,
        choice,
        isPublic,
      });

      const vote = await storage.createVote(voteData);

      res.status(201).json({ vote });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get user's votes
  app.get('/api/votes/mine', async (req, res) => {
    try {
      const privyUserId = req.header('x-privy-user-id');
      if (!privyUserId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await storage.getUserByPrivyId(privyUserId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const votes = await storage.getUserVotes(user.id);
      res.json(votes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get user's vote for a specific question
  app.get('/api/votes/:questionId/mine', async (req, res) => {
    try {
      const privyUserId = req.header('x-privy-user-id');
      if (!privyUserId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await storage.getUserByPrivyId(privyUserId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const vote = await storage.getVote(user.id, req.params.questionId);
      res.json(vote || null);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===== RESULTS ROUTES =====
  
  // Get question results
  app.get('/api/results/:questionId', async (req, res) => {
    try {
      const question = await storage.getQuestion(req.params.questionId);
      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }

      if (!question.isRevealed) {
        return res.status(403).json({ error: 'Results not yet revealed' });
      }

      const results = await storage.getQuestionResults(req.params.questionId);
      if (!results) {
        // Calculate results if not yet calculated
        const votes = await storage.getQuestionVotes(req.params.questionId);
        const totalVotes = votes.length;

        const voteCounts = { A: 0, B: 0, C: 0, D: 0 };
        votes.forEach(v => {
          voteCounts[v.choice] += 1;
        });

        const percentages = {
          A: totalVotes > 0 ? Math.round((voteCounts.A / totalVotes) * 100) : 0,
          B: totalVotes > 0 ? Math.round((voteCounts.B / totalVotes) * 100) : 0,
          C: totalVotes > 0 ? Math.round((voteCounts.C / totalVotes) * 100) : 0,
          D: totalVotes > 0 ? Math.round((voteCounts.D / totalVotes) * 100) : 0,
        };

        // Calculate rarity multipliers (inverse of percentage, capped at 10x)
        const rarityMultipliers = {
          A: percentages.A > 0 ? Math.min(Math.round(100 / percentages.A), 10) : 1,
          B: percentages.B > 0 ? Math.min(Math.round(100 / percentages.B), 10) : 1,
          C: percentages.C > 0 ? Math.min(Math.round(100 / percentages.C), 10) : 1,
          D: percentages.D > 0 ? Math.min(Math.round(100 / percentages.D), 10) : 1,
        };

        const newResults = await storage.createQuestionResults({
          questionId: req.params.questionId,
          totalVotes,
          percentA: percentages.A,
          percentB: percentages.B,
          percentC: percentages.C,
          percentD: percentages.D,
          votesA: voteCounts.A,
          votesB: voteCounts.B,
          votesC: voteCounts.C,
          votesD: voteCounts.D,
          rarityMultipliers,
        });

        // Award points to voters
        for (const vote of votes) {
          const rarityMultiplier = rarityMultipliers[vote.choice];
          const publicMultiplier = vote.isPublic ? 2 : 1;
          const basePoints = 100;
          const points = basePoints * rarityMultiplier * publicMultiplier;

          await storage.updateUser(vote.userId, {
            alphaPoints: (await storage.getUser(vote.userId))!.alphaPoints + points,
          });
        }

        return res.json(newResults);
      }

      res.json(results);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===== LEADERBOARD ROUTE =====
  
  app.get('/api/leaderboard', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const leaders = await storage.getLeaderboard(limit);
      res.json(leaders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===== SEED DATA (Development only) =====
  
  app.post('/api/seed/questions', async (req, res) => {
    try {
      const now = new Date();
      const dropTime = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
      const revealTime = new Date(now.getTime() + 10 * 60 * 60 * 1000); // 10 hours from now

      const questions = [
        {
          type: 'consensus' as const,
          prompt: 'Which token will trend most on Twitter this week?',
          context: 'Predict what the crowd thinks will happen',
          optionA: 'BONK',
          optionB: 'DOGE',
          optionC: 'WIF',
          optionD: 'PEPE',
          dropsAt: dropTime,
          revealsAt: revealTime,
          isActive: true,
          isRevealed: false,
        },
        {
          type: 'prediction' as const,
          prompt: 'Will BTC close above $100k this week?',
          optionA: 'Yes, definitely',
          optionB: 'No, below $100k',
          optionC: null,
          optionD: null,
          dropsAt: dropTime,
          revealsAt: revealTime,
          isActive: true,
          isRevealed: false,
        },
        {
          type: 'preference' as const,
          prompt: 'Most iconic crypto founder?',
          context: 'Who does the crowd love most?',
          optionA: 'Vitalik',
          optionB: 'Satoshi',
          optionC: 'CZ',
          optionD: 'SBF',
          dropsAt: dropTime,
          revealsAt: revealTime,
          isActive: true,
          isRevealed: false,
        },
      ];

      const created = [];
      for (const q of questions) {
        const question = await storage.createQuestion(q as any);
        created.push(question);
      }

      res.json({ success: true, questions: created });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
