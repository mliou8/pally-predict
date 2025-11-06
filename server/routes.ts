import type { Express } from 'express';
import { createServer, type Server } from 'http';
import { storage } from './storage';
import { insertUserSchema, insertQuestionSchema, insertVoteSchema } from '@shared/schema';

// Helper function to check and mark questions as revealed
// Optimized to update all eligible questions in a single query
async function checkAndRevealQuestions() {
  const now = new Date();
  
  // Update all questions that should be revealed in a single query
  await storage.revealExpiredQuestions(now);
}

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
      // Check and reveal questions that have passed their reveal time
      await checkAndRevealQuestions();
      
      const questions = await storage.getActiveQuestions();
      res.json(questions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get revealed questions (results available)
  app.get('/api/questions/revealed', async (req, res) => {
    try {
      // Check and reveal questions that have passed their reveal time
      await checkAndRevealQuestions();
      
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
      // Check and reveal questions that have passed their reveal time
      await checkAndRevealQuestions();
      
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

        // Award points to voters and update vote records
        for (const vote of votes) {
          const rarityMultiplier = rarityMultipliers[vote.choice];
          const publicMultiplier = vote.isPublic ? 2 : 1;
          const basePoints = 100;
          const totalMultiplier = rarityMultiplier * publicMultiplier;
          const points = basePoints * totalMultiplier;

          // Update user's alpha points
          const currentUser = await storage.getUser(vote.userId);
          if (currentUser) {
            await storage.updateUser(vote.userId, {
              alphaPoints: currentUser.alphaPoints + points,
            });
          }

          // Update vote record with points earned and total multiplier
          await storage.updateVote(vote.id, {
            pointsEarned: points,
            multiplier: totalMultiplier,
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

  // ===== ADMIN ROUTES =====
  
  // Get all questions (admin only)
  app.get('/api/admin/questions', async (req, res) => {
    try {
      const privyUserId = req.header('x-privy-user-id');
      if (!privyUserId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Check if user is admin
      const user = await storage.getUserByPrivyId(privyUserId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      if (!user.isAdmin) {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
      }

      const questions = await storage.getAllQuestions();
      res.json(questions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create question (admin only)
  app.post('/api/admin/questions', async (req, res) => {
    try {
      const privyUserId = req.header('x-privy-user-id');
      if (!privyUserId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Check if user is admin
      const user = await storage.getUserByPrivyId(privyUserId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      if (!user.isAdmin) {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
      }

      const questionData = insertQuestionSchema.parse(req.body);
      const question = await storage.createQuestion(questionData);

      res.status(201).json(question);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Delete question (admin only)
  app.delete('/api/admin/questions/:id', async (req, res) => {
    try {
      const privyUserId = req.header('x-privy-user-id');
      if (!privyUserId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Check if user is admin
      const user = await storage.getUserByPrivyId(privyUserId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      if (!user.isAdmin) {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
      }

      const { id } = req.params;
      
      // Check if question has votes before deleting (optimized count query)
      const votesCount = await storage.getQuestionVotesCount(id);
      if (votesCount > 0) {
        return res.status(409).json({ 
          error: 'Cannot delete question with existing votes',
          votesCount 
        });
      }

      await storage.deleteQuestion(id);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Fast-track tomorrow's questions to today (admin only)
  app.post('/api/admin/fast-track', async (req, res) => {
    try {
      const privyUserId = req.header('x-privy-user-id');
      if (!privyUserId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Check if user is admin
      const user = await storage.getUserByPrivyId(privyUserId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      if (!user.isAdmin) {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
      }

      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      
      // Determine if we're in EDT or EST
      const etOffset = now.toLocaleString('en-US', { 
        timeZone: 'America/New_York', 
        timeZoneName: 'short' 
      }).includes('EDT') ? -4 : -5;
      
      // Today's noon ET in UTC
      const todayNoonET = new Date(`${year}-${month}-${day}T12:00:00`);
      todayNoonET.setHours(12 - etOffset);
      
      // Tomorrow's noon ET in UTC (new reveal time)
      const tomorrowNoonET = new Date(todayNoonET.getTime() + 24 * 60 * 60 * 1000);

      // Fast-track questions
      const updatedCount = await storage.fastTrackQuestions(todayNoonET, tomorrowNoonET);

      res.json({ 
        success: true, 
        message: `${updatedCount} questions fast-tracked to today`,
        updatedCount 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===== SEED DATA (Development only) =====
  
  // Seed 5 days of historical polls with 100 mock users
  app.post('/api/seed/historical', async (req, res) => {
    try {
      const now = new Date();
      
      // Calculate today's noon ET in UTC
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      
      // Determine if we're in EDT or EST
      const etOffset = now.toLocaleString('en-US', { 
        timeZone: 'America/New_York', 
        timeZoneName: 'short' 
      }).includes('EDT') ? -4 : -5;
      
      // Today's noon ET in UTC as base
      const todayNoonET = new Date(`${year}-${month}-${day}T12:00:00`);
      todayNoonET.setHours(12 - etOffset);
      
      // Create 100 mock users
      const mockUsers = [];
      for (let i = 1; i <= 100; i++) {
        const handle = `user${i}`;
        const privyId = `mock_user_${i}_${Date.now()}`;
        
        try {
          const user = await storage.createUser({
            privyUserId: privyId,
            handle,
          });
          mockUsers.push(user);
        } catch (error) {
          // User might already exist, skip
          const existingUser = await storage.getUserByHandle(handle);
          if (existingUser) {
            mockUsers.push(existingUser);
          }
        }
      }
      
      // Create questions for past 5 days (3 questions per day)
      const questions = [];
      const questionsData = [
        // Day 5 (oldest)
        {
          type: 'consensus' as const,
          prompt: 'Which L2 will have the most TVL by end of month?',
          context: 'Predict what the crowd thinks',
          optionA: 'Arbitrum',
          optionB: 'Optimism',
          optionC: 'Base',
          optionD: 'zkSync',
        },
        {
          type: 'prediction' as const,
          prompt: 'Will ETH flip BTC in market cap this year?',
          optionA: 'Yes, the flippening happens',
          optionB: 'No, BTC stays #1',
          optionC: null,
          optionD: null,
        },
        {
          type: 'preference' as const,
          prompt: 'Best DEX for trading?',
          context: 'What does the crowd prefer?',
          optionA: 'Uniswap',
          optionB: 'PancakeSwap',
          optionC: 'Curve',
          optionD: 'SushiSwap',
        },
        // Day 4
        {
          type: 'consensus' as const,
          prompt: 'Which narrative will dominate crypto Twitter next week?',
          optionA: 'AI agents',
          optionB: 'RWA tokens',
          optionC: 'Memecoins',
          optionD: 'DeFi 2.0',
        },
        {
          type: 'prediction' as const,
          prompt: 'Will SOL reach $200 this month?',
          optionA: 'Yes, definitely',
          optionB: 'No way',
          optionC: null,
          optionD: null,
        },
        {
          type: 'preference' as const,
          prompt: 'Most important crypto metric?',
          optionA: 'Price action',
          optionB: 'TVL',
          optionC: 'Developer activity',
          optionD: 'User count',
        },
        // Day 3
        {
          type: 'consensus' as const,
          prompt: 'Which memecoin will pump the hardest this week?',
          context: 'Predict crowd sentiment',
          optionA: 'DOGE',
          optionB: 'SHIB',
          optionC: 'PEPE',
          optionD: 'WIF',
        },
        {
          type: 'prediction' as const,
          prompt: 'Will gas fees stay under 20 gwei all week?',
          optionA: 'Yes, cheap gas era',
          optionB: 'No, spike incoming',
          optionC: null,
          optionD: null,
        },
        {
          type: 'preference' as const,
          prompt: 'Best wallet for daily use?',
          optionA: 'MetaMask',
          optionB: 'Rabby',
          optionC: 'Rainbow',
          optionD: 'Phantom',
        },
        // Day 2
        {
          type: 'consensus' as const,
          prompt: 'What will be the next major crypto catalyst?',
          optionA: 'ETF approvals',
          optionB: 'Fed rate cuts',
          optionC: 'New L1 launch',
          optionD: 'Major hack/exploit',
        },
        {
          type: 'prediction' as const,
          prompt: 'Will we see a new ATH for crypto market cap this quarter?',
          optionA: 'Yes, new highs coming',
          optionB: 'No, consolidation phase',
          optionC: null,
          optionD: null,
        },
        {
          type: 'preference' as const,
          prompt: 'Best source for crypto news?',
          optionA: 'Crypto Twitter',
          optionB: 'Discord/Telegram',
          optionC: 'Traditional media',
          optionD: 'Reddit',
        },
        // Day 1 (most recent)
        {
          type: 'consensus' as const,
          prompt: 'Which sector will outperform in Q1 2025?',
          optionA: 'DeFi',
          optionB: 'NFTs',
          optionC: 'Gaming',
          optionD: 'Infrastructure',
        },
        {
          type: 'prediction' as const,
          prompt: 'Will Bitcoin dominance drop below 40% this quarter?',
          optionA: 'Yes, altseason incoming',
          optionB: 'No, BTC stays dominant',
          optionC: null,
          optionD: null,
        },
        {
          type: 'preference' as const,
          prompt: 'Most trustworthy crypto influencer type?',
          optionA: 'Developers',
          optionB: 'Analysts',
          optionC: 'Traders',
          optionD: 'Educators',
        },
      ];
      
      // Create questions for each day
      for (let day = 0; day < 5; day++) {
        const daysAgo = 5 - day;
        const dropTime = new Date(todayNoonET.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        const revealTime = new Date(dropTime.getTime() + 24 * 60 * 60 * 1000);
        
        for (let i = 0; i < 3; i++) {
          const questionIndex = day * 3 + i;
          const questionData = {
            ...questionsData[questionIndex],
            dropsAt: dropTime,
            revealsAt: revealTime,
            isActive: false, // Old questions are inactive
            isRevealed: true, // All historical questions are revealed
          };
          
          const question = await storage.createQuestion(questionData as any);
          questions.push(question);
        }
      }
      
      // Define vote distributions for different question types
      const fourOptionDistributions = [
        // Balanced distributions
        { A: 0.25, B: 0.25, C: 0.25, D: 0.25 },
        { A: 0.35, B: 0.35, C: 0.15, D: 0.15 },
        // Dominant winner distributions
        { A: 0.45, B: 0.30, C: 0.15, D: 0.10 },
        { A: 0.20, B: 0.50, C: 0.20, D: 0.10 },
        { A: 0.15, B: 0.25, C: 0.40, D: 0.20 },
      ];
      
      const binaryDistributions = [
        { A: 0.60, B: 0.40 },
        { A: 0.35, B: 0.65 },
        { A: 0.55, B: 0.45 },
        { A: 0.50, B: 0.50 },
        { A: 0.45, B: 0.55 },
      ];
      
      const choices: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
      let totalVotesCreated = 0;
      
      for (const question of questions) {
        // Determine if this is a binary question (only A and B)
        const isBinary = question.optionC === null && question.optionD === null;
        
        // Pick appropriate distribution based on question type
        const distributions = isBinary ? binaryDistributions : fourOptionDistributions;
        const rawDistribution = distributions[Math.floor(Math.random() * distributions.length)];
        
        // Normalize distribution to only include available options
        const availableOptions = choices.filter(opt => {
          if (opt === 'A' || opt === 'B') return true;
          if (opt === 'C') return question.optionC !== null;
          if (opt === 'D') return question.optionD !== null;
          return false;
        });
        
        // Recalculate percentages to sum to 1.0 for available options only
        const normalizedDistribution: Record<string, number> = {};
        let totalProb = 0;
        for (const opt of availableOptions) {
          const key = opt as keyof typeof rawDistribution;
          totalProb += (rawDistribution[key] as number) || 0;
        }
        for (const opt of availableOptions) {
          const key = opt as keyof typeof rawDistribution;
          normalizedDistribution[opt] = ((rawDistribution[key] as number) || 0) / totalProb;
        }
        
        // Each user votes with some probability (80-95% participation)
        const participationRate = 0.8 + Math.random() * 0.15;
        
        for (const user of mockUsers) {
          if (Math.random() > participationRate) continue;
          
          // Determine vote choice based on normalized distribution
          const rand = Math.random();
          let choice: 'A' | 'B' | 'C' | 'D' = 'A';
          let cumulative = 0;
          
          for (const option of availableOptions) {
            cumulative += normalizedDistribution[option] || 0;
            if (rand <= cumulative) {
              choice = option as 'A' | 'B' | 'C' | 'D';
              break;
            }
          }
          
          // Random mix of public/private votes (60% public, 40% private)
          const isPublic = Math.random() < 0.6;
          
          try {
            await storage.createVote({
              userId: user.id,
              questionId: question.id,
              choice,
              isPublic,
            });
            totalVotesCreated++;
          } catch (error) {
            // Vote might already exist, skip
          }
        }
      }
      
      // Clear any cached results for the seeded questions
      // This ensures results recalculate with the fresh votes
      const questionIds = questions.map(q => q.id);
      for (const qid of questionIds) {
        try {
          const results = await storage.getQuestionResults(qid);
          if (results && results.totalVotes === 0) {
            // Results were cached with 0 votes, need manual cleanup
            // Users should run: DELETE FROM question_results WHERE total_votes = 0;
          }
        } catch (error) {
          // Ignore errors
        }
      }
      
      res.json({ 
        success: true, 
        message: `Created ${mockUsers.length} users, ${questions.length} questions, and ${totalVotesCreated} votes`,
        users: mockUsers.length,
        questions: questions.length,
        votes: totalVotesCreated,
        note: 'If results show 0 votes, run: DELETE FROM question_results WHERE total_votes = 0;',
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post('/api/seed/questions', async (req, res) => {
    try {
      const now = new Date();
      
      // Calculate today's noon ET in UTC
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      
      // Determine if we're in EDT or EST
      const etOffset = now.toLocaleString('en-US', { 
        timeZone: 'America/New_York', 
        timeZoneName: 'short' 
      }).includes('EDT') ? -4 : -5;
      
      // Today's noon ET in UTC
      const todayNoonET = new Date(`${year}-${month}-${day}T12:00:00`);
      todayNoonET.setHours(12 - etOffset); // Convert to UTC
      
      // Tomorrow's noon ET in UTC (reveal time)
      const tomorrowNoonET = new Date(todayNoonET.getTime() + 24 * 60 * 60 * 1000);
      
      const dropTime = todayNoonET;
      const revealTime = tomorrowNoonET;

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
