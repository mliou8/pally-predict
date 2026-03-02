import type { Express } from 'express';
import type { Server } from 'http';
import { storage } from './storage';
import { insertUserSchema, insertQuestionSchema, insertVoteSchema, type VoteChoice, type PlatformType } from '@shared/schema';
import { randomBytes } from 'crypto';
import { PublicKey, Connection } from '@solana/web3.js';
import nacl from 'tweetnacl';
import {
  generateToken,
  hashPassword,
  verifyPassword,
  mobileAuthMiddleware,
} from './jwt-auth';

// Solana connection for transaction verification
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const solanaConnection = new Connection(SOLANA_RPC_URL, 'confirmed');

// In-memory nonce storage (in production, use Redis or database)
// Stores nonce, wallet address, timestamp, and user ID to prevent replay attacks
const nonceStore = new Map<string, { nonce: string; address: string; timestamp: number; userId: string }>();
const NONCE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

// Helper function to serialize BigInt fields to strings for JSON responses
// This is necessary because JSON.stringify cannot handle BigInt values
function serializeBigInt<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return obj.toString() as any;
  if (Array.isArray(obj)) return obj.map(serializeBigInt) as any;
  if (typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeBigInt(value);
    }
    return result;
  }
  return obj;
}

// Helper function to check and mark questions as revealed
// Optimized to update all eligible questions in a single query
async function checkAndRevealQuestions() {
  const now = new Date();

  // Update all questions that should be revealed in a single query
  await storage.revealExpiredQuestions(now);
}

// Helper function to format time ago
function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export async function registerRoutes(app: Express, server?: Server): Promise<void> {
  // Health check is now registered in index.ts before this is called

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
      console.error('API Error:', error);
      res.status(500).json({ error: error.message || String(error) || 'Unknown error' });
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
      console.error('API Error:', error);
      res.status(500).json({ error: error.message || String(error) || 'Unknown error' });
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
      console.error('API Error:', error);
      res.status(500).json({ error: error.message || String(error) || 'Unknown error' });
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
      console.error('API Error (questions/active):', error);
      const errorInfo = {
        message: error.message,
        name: error.name,
        code: error.code,
        detail: error.detail,
        hint: error.hint,
        toString: String(error),
      };
      console.error('Error details:', JSON.stringify(errorInfo, null, 2));
      res.status(500).json({
        error: error.message || error.code || String(error) || 'Unknown error',
        details: errorInfo
      });
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
      console.error('API Error:', error);
      res.status(500).json({ error: error.message || String(error) || 'Unknown error' });
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
      console.error('API Error:', error);
      res.status(500).json({ error: error.message || String(error) || 'Unknown error' });
    }
  });

  // Get live stats for a question (vote distribution, implied odds)
  app.get('/api/questions/:id/live-stats', async (req, res) => {
    try {
      const question = await storage.getQuestion(req.params.id);
      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }

      const stats = await storage.getQuestionStats(req.params.id);
      const totalVotes = stats.votesA + stats.votesB + stats.votesC + stats.votesD;

      // Calculate percentages and implied multipliers
      const calcMultiplier = (votes: number) => {
        if (totalVotes === 0 || votes === 0) return 10; // Max multiplier for no votes
        const percentage = (votes / totalVotes) * 100;
        // Inverse relationship: fewer picks = higher multiplier, capped at 10x
        return Math.min(Math.max(Math.round(100 / percentage), 1), 10);
      };

      res.json({
        totalVotes,
        distribution: {
          A: { votes: stats.votesA, percent: totalVotes > 0 ? Math.round((stats.votesA / totalVotes) * 100) : 0, multiplier: calcMultiplier(stats.votesA) },
          B: { votes: stats.votesB, percent: totalVotes > 0 ? Math.round((stats.votesB / totalVotes) * 100) : 0, multiplier: calcMultiplier(stats.votesB) },
          C: { votes: stats.votesC, percent: totalVotes > 0 ? Math.round((stats.votesC / totalVotes) * 100) : 0, multiplier: calcMultiplier(stats.votesC) },
          D: { votes: stats.votesD, percent: totalVotes > 0 ? Math.round((stats.votesD / totalVotes) * 100) : 0, multiplier: calcMultiplier(stats.votesD) },
        },
      });
    } catch (error: any) {
      console.error('API Error:', error);
      res.status(500).json({ error: error.message || String(error) || 'Unknown error' });
    }
  });

  // Create question (admin only)
  app.post('/api/questions', async (req, res) => {
    try {
      // Require admin key for question creation
      const adminKey = req.header('x-admin-key');
      const expectedKey = process.env.TELEGRAM_ADMIN_KEY;

      if (!expectedKey) {
        console.warn('WARNING: TELEGRAM_ADMIN_KEY not configured. Set it in your environment.');
        return res.status(500).json({ error: 'Admin authentication not configured' });
      }

      if (!adminKey || adminKey !== expectedKey) {
        return res.status(401).json({ error: 'Admin authentication required' });
      }

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

      const { questionId, choice, isPublic = true, wagerAmount } = req.body;

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

      // Create the vote with optional wager
      const voteData: any = {
        userId: user.id,
        questionId,
        choice,
        isPublic,
      };

      // Add wagerAmount if provided (convert string to BigInt)
      if (wagerAmount !== undefined && wagerAmount !== null) {
        voteData.wagerAmount = BigInt(wagerAmount);
      }

      const parsedVoteData = insertVoteSchema.parse(voteData);

      const vote = await storage.createVote(parsedVoteData);

      res.status(201).json({ vote: serializeBigInt(vote) });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get recent activity feed (public votes, anonymized)
  app.get('/api/activity/recent', async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 20);
      const questionId = req.query.questionId as string | undefined;

      const recentVotes = await storage.getRecentPublicVotes(limit, questionId);

      // Anonymize and format for display
      const activity = await Promise.all(recentVotes.map(async (vote) => {
        const user = await storage.getUser(vote.userId);
        const handle = user?.handle || 'Anonymous';
        // Partially obscure handle for privacy
        const displayHandle = handle.length > 3
          ? handle.slice(0, 2) + '***' + handle.slice(-1)
          : '***';

        return {
          id: vote.id,
          handle: displayHandle,
          choice: vote.choice,
          timestamp: vote.votedAt,
          timeAgo: getTimeAgo(new Date(vote.votedAt)),
        };
      }));

      res.json(activity);
    } catch (error: any) {
      console.error('API Error:', error);
      res.status(500).json({ error: error.message || String(error) || 'Unknown error' });
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
      res.json(serializeBigInt(votes));
    } catch (error: any) {
      console.error('API Error:', error);
      res.status(500).json({ error: error.message || String(error) || 'Unknown error' });
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
      res.json(vote ? serializeBigInt(vote) : null);
    } catch (error: any) {
      console.error('API Error:', error);
      res.status(500).json({ error: error.message || String(error) || 'Unknown error' });
    }
  });

  // ===== WAGER ROUTES =====
  
  // Initiate a wager (creates vote with pending wager)
  app.post('/api/wager/initiate', async (req, res) => {
    try {
      const privyUserId = req.header('x-privy-user-id');
      if (!privyUserId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await storage.getUserByPrivyId(privyUserId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Require linked wallet for wagering
      if (!user.solanaAddress) {
        return res.status(400).json({ error: 'Please link a Solana wallet first' });
      }

      const { questionId, choice, isPublic = true, wagerAmount } = req.body;

      if (!questionId || !choice) {
        return res.status(400).json({ error: 'Question ID and choice are required' });
      }

      // Validate wager amount (must be positive if provided)
      const wagerLamports = wagerAmount ? BigInt(wagerAmount) : BigInt(0);
      if (wagerLamports < BigInt(0)) {
        return res.status(400).json({ error: 'Wager amount must be positive' });
      }

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

      // Get escrow address from environment (for real transactions)
      // Note: For wagers > 0, ESCROW_WALLET_ADDRESS must be set for verify to work
      const escrowAddress = process.env.ESCROW_WALLET_ADDRESS || 'NOT_CONFIGURED';

      // Create the vote with pending wager status
      const voteData = {
        userId: user.id,
        questionId,
        choice,
        isPublic,
        wagerAmount: wagerLamports,
      };

      const parsedVoteData = insertVoteSchema.parse(voteData);
      const vote = await storage.createVote(parsedVoteData);

      // Return info needed for user to send transaction
      res.status(201).json({ 
        vote: serializeBigInt(vote),
        escrowAddress,
        wagerAmount: wagerLamports.toString(),
        memo: `PALLY|vote:${vote.id}|q:${questionId}|u:${user.id}|amt:${wagerLamports}`,
        message: wagerLamports > BigInt(0) 
          ? 'Please send the wager amount to the escrow address and call /api/wager/verify with the transaction signature'
          : 'Vote recorded successfully (no wager)',
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Verify a wager transaction with on-chain validation
  app.post('/api/wager/verify', async (req, res) => {
    try {
      const privyUserId = req.header('x-privy-user-id');
      if (!privyUserId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await storage.getUserByPrivyId(privyUserId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (!user.solanaAddress) {
        return res.status(400).json({ error: 'User has no linked wallet' });
      }

      const { voteId, txSignature } = req.body;

      if (!voteId || !txSignature) {
        return res.status(400).json({ error: 'Vote ID and transaction signature are required' });
      }

      // Get the vote
      const allVotes = await storage.getUserVotes(user.id);
      const vote = allVotes.find(v => v.id === voteId);
      
      if (!vote) {
        return res.status(404).json({ error: 'Vote not found' });
      }

      if (vote.userId !== user.id) {
        return res.status(403).json({ error: 'Not authorized to verify this vote' });
      }

      // Check if already verified
      if (vote.wagerTxSig) {
        return res.status(400).json({ error: 'Wager already verified' });
      }

      // Check for transaction signature replay attack - ensure this txSig hasn't been used before
      const existingVoteWithTx = await storage.getVoteByTxSignature(txSignature);
      if (existingVoteWithTx) {
        return res.status(400).json({ 
          error: 'Transaction signature has already been used for another wager',
          existingVoteId: existingVoteWithTx.id,
        });
      }

      // Get and validate escrow address
      const escrowAddress = process.env.ESCROW_WALLET_ADDRESS;
      if (!escrowAddress) {
        return res.status(500).json({ error: 'Server configuration error: ESCROW_WALLET_ADDRESS not set' });
      }
      
      // Validate escrow address is a valid Solana public key
      try {
        new PublicKey(escrowAddress);
      } catch {
        return res.status(500).json({ error: 'Server configuration error: Invalid ESCROW_WALLET_ADDRESS' });
      }

      // On-chain verification
      try {
        // 1. Fetch the transaction
        const txInfo = await solanaConnection.getTransaction(txSignature, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0,
        });

        if (!txInfo) {
          return res.status(400).json({ error: 'Transaction not found on-chain. Please wait for confirmation and try again.' });
        }

        // 2. Verify transaction was successful
        if (txInfo.meta?.err) {
          return res.status(400).json({ error: 'Transaction failed on-chain' });
        }

        // 3. Get account keys from the transaction
        const message = txInfo.transaction.message;
        const accountKeys = message.getAccountKeys();
        
        // 4. Verify sender is user's linked wallet
        const senderKey = accountKeys.get(0);
        if (!senderKey || senderKey.toBase58() !== user.solanaAddress) {
          return res.status(400).json({ 
            error: 'Transaction sender does not match linked wallet',
            expected: user.solanaAddress,
            received: senderKey?.toBase58(),
          });
        }

        // 5. Find the SOL transfer to escrow in post balances
        // Look for the escrow address in the account keys
        let escrowIndex = -1;
        for (let i = 0; i < accountKeys.length; i++) {
          const key = accountKeys.get(i);
          if (key && key.toBase58() === escrowAddress) {
            escrowIndex = i;
            break;
          }
        }

        if (escrowIndex === -1) {
          return res.status(400).json({ error: 'Escrow address not found in transaction' });
        }

        // 6. Calculate the transfer amount (pre -> post balance change for escrow)
        const preBalances = txInfo.meta?.preBalances || [];
        const postBalances = txInfo.meta?.postBalances || [];
        const transferAmount = BigInt(postBalances[escrowIndex] - preBalances[escrowIndex]);

        // 7. Verify amount matches wager (allow for slight variance due to rent)
        const expectedAmount = vote.wagerAmount;
        if (transferAmount < expectedAmount) {
          return res.status(400).json({ 
            error: 'Transfer amount is less than wager amount',
            expected: expectedAmount.toString(),
            received: transferAmount.toString(),
          });
        }

        // Verification passed - record the transaction signature
        const updatedVote = await storage.updateVote(voteId, {
          wagerTxSig: txSignature,
        });

        res.json({ 
          success: true, 
          message: 'Wager verified on-chain successfully',
          vote: serializeBigInt(updatedVote),
          verification: {
            txSignature,
            sender: user.solanaAddress,
            receiver: escrowAddress,
            amount: transferAmount.toString(),
          },
        });
      } catch (verifyError: any) {
        console.error('On-chain verification error:', verifyError);
        return res.status(400).json({ 
          error: 'Failed to verify transaction on-chain',
          details: verifyError.message,
        });
      }
    } catch (error: any) {
      console.error('API Error:', error);
      res.status(500).json({ error: error.message || String(error) || 'Unknown error' });
    }
  });

  // Get user's stats (wins, earnings)
  app.get('/api/user/stats', async (req, res) => {
    try {
      const privyUserId = req.header('x-privy-user-id');
      if (!privyUserId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await storage.getUserByPrivyId(privyUserId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get all user's votes
      const userVotes = await storage.getUserVotes(user.id);
      
      // Calculate stats
      let totalWagered = BigInt(0);
      let totalEarned = BigInt(0);
      let correctPredictions = 0;
      let totalPredictions = 0;

      for (const vote of userVotes) {
        // Only count votes with results (question has been revealed)
        if (vote.pointsEarned !== null && vote.pointsEarned !== undefined) {
          totalPredictions++;
          totalWagered += vote.wagerAmount;
          
          if (vote.payoutAmount && vote.payoutAmount > BigInt(0)) {
            correctPredictions++;
            totalEarned += vote.payoutAmount;
          }
        }
      }

      // Calculate profit
      const profit = totalEarned - totalWagered;

      res.json({
        totalPredictions,
        correctPredictions,
        accuracy: totalPredictions > 0 ? Math.round((correctPredictions / totalPredictions) * 100) : 0,
        totalWagered: totalWagered.toString(),
        totalEarned: totalEarned.toString(),
        profit: profit.toString(),
        alphaPoints: user.alphaPoints,
        currentStreak: user.currentStreak,
        maxStreak: user.maxStreak,
      });
    } catch (error: any) {
      console.error('API Error:', error);
      res.status(500).json({ error: error.message || String(error) || 'Unknown error' });
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

        // Calculate total pot from all wagers
        const totalPot = votes.reduce((sum, v) => sum + v.wagerAmount, BigInt(0));

        // Determine winning choice (highest vote count)
        // Sort by vote count descending, then alphabetically for deterministic tie-breaking
        const sortedChoices = Object.entries(voteCounts)
          .sort((a, b) => {
            const countDiff = b[1] - a[1]; // Higher count first
            if (countDiff !== 0) return countDiff;
            return a[0].localeCompare(b[0]); // Alphabetical for ties (A wins over B)
          });

        const winningChoice = sortedChoices[0][0] as 'A' | 'B' | 'C' | 'D';
        const secondPlaceChoice = sortedChoices.length > 1 ? sortedChoices[1][0] as 'A' | 'B' | 'C' | 'D' : null;

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
          totalPot,
        });

        // Award points and distribute bet payouts (idempotency: only if not already processed)
        // Check if rewards have already been processed by checking if any vote has pointsEarned set
        const alreadyProcessed = votes.some(v => v.pointsEarned !== null && v.pointsEarned !== undefined);

        if (!alreadyProcessed) {
          // Use atomic transaction to distribute rewards
          // 2nd place gets 25% of their wager back as consolation
          await storage.distributeRewards({
            questionVotes: votes,
            winningChoice,
            secondPlaceChoice,
            rarityMultipliers: rarityMultipliers as Record<'A' | 'B' | 'C' | 'D', number>,
            totalPot,
          });
        }

        return res.json(serializeBigInt(newResults));
      }

      res.json(serializeBigInt(results));
    } catch (error: any) {
      console.error('API Error:', error);
      res.status(500).json({ error: error.message || String(error) || 'Unknown error' });
    }
  });

  // ===== LEADERBOARD ROUTE =====
  
  app.get('/api/leaderboard', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const leaders = await storage.getLeaderboard(limit);
      res.json(leaders);
    } catch (error: any) {
      console.error('API Error:', error);
      res.status(500).json({ error: error.message || String(error) || 'Unknown error' });
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
      console.error('API Error:', error);
      res.status(500).json({ error: error.message || String(error) || 'Unknown error' });
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
      console.error('API Error:', error);
      res.status(500).json({ error: error.message || String(error) || 'Unknown error' });
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
      console.error('API Error:', error);
      res.status(500).json({ error: error.message || String(error) || 'Unknown error' });
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
      console.error('API Error:', error);
      res.status(500).json({ error: error.message || String(error) || 'Unknown error' });
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
      console.error('API Error:', error);
      res.status(500).json({ error: error.message || String(error) || 'Unknown error' });
    }
  });

  // ===== SOLANA WALLET LINKING ROUTES =====
  
  // Generate a nonce for wallet signature verification
  app.get('/api/solana/nonce', async (req, res) => {
    try {
      const privyUserId = req.header('x-privy-user-id');
      if (!privyUserId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await storage.getUserByPrivyId(privyUserId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Address is required to bind the nonce to a specific wallet
      const address = req.query.address as string;
      if (!address) {
        return res.status(400).json({ error: 'Wallet address is required' });
      }

      // Generate a random nonce
      const nonce = randomBytes(32).toString('hex');
      const timestamp = new Date().toISOString();
      
      // Store nonce with timestamp, address, and user ID (keyed by user ID)
      // This ensures the nonce is bound to this specific user and wallet
      nonceStore.set(user.id, { 
        nonce, 
        address, 
        timestamp: Date.now(),
        userId: user.id,
      });
      
      // Clean up expired nonces periodically
      const now = Date.now();
      for (const [key, value] of Array.from(nonceStore.entries())) {
        if (now - value.timestamp > NONCE_EXPIRY_MS) {
          nonceStore.delete(key);
        }
      }

      // Message format includes all bound parameters to prevent replay attacks
      const message = `PALLY|link|user:${user.id}|addr:${address}|nonce:${nonce}|ts:${timestamp}`;

      res.json({ 
        nonce,
        address,
        timestamp,
        message,
      });
    } catch (error: any) {
      console.error('API Error:', error);
      res.status(500).json({ error: error.message || String(error) || 'Unknown error' });
    }
  });

  // Link Solana wallet to user account
  app.post('/api/solana/link', async (req, res) => {
    try {
      const privyUserId = req.header('x-privy-user-id');
      if (!privyUserId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await storage.getUserByPrivyId(privyUserId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { address, signature, message } = req.body;
      
      if (!address || !signature || !message) {
        return res.status(400).json({ error: 'Address, signature, and message are required' });
      }

      // Verify nonce exists and hasn't expired
      const storedNonceData = nonceStore.get(user.id);
      if (!storedNonceData) {
        return res.status(400).json({ error: 'No nonce found. Please request a new one.' });
      }

      if (Date.now() - storedNonceData.timestamp > NONCE_EXPIRY_MS) {
        nonceStore.delete(user.id);
        return res.status(400).json({ error: 'Nonce expired. Please request a new one.' });
      }

      // Verify the message contains the correct bound parameters
      // Message format: PALLY|link|user:{userId}|addr:{address}|nonce:{nonce}|ts:{timestamp}
      const expectedPrefix = `PALLY|link|user:${user.id}|addr:${storedNonceData.address}|nonce:${storedNonceData.nonce}`;
      if (!message.startsWith(expectedPrefix)) {
        nonceStore.delete(user.id);
        return res.status(400).json({ error: 'Invalid message format or parameters do not match' });
      }

      // Verify the address matches what was bound to the nonce
      if (address !== storedNonceData.address) {
        nonceStore.delete(user.id);
        return res.status(400).json({ error: 'Wallet address does not match the one used for nonce generation' });
      }

      // Verify the signature
      try {
        const publicKey = new PublicKey(address);
        const messageBytes = new TextEncoder().encode(message);
        const signatureBytes = Buffer.from(signature, 'base64');
        
        const isValid = nacl.sign.detached.verify(
          messageBytes,
          signatureBytes,
          publicKey.toBytes()
        );

        if (!isValid) {
          return res.status(400).json({ error: 'Invalid signature' });
        }
      } catch (error) {
        return res.status(400).json({ error: 'Invalid wallet address or signature format' });
      }

      // Immediately invalidate the nonce (one-time use)
      nonceStore.delete(user.id);

      // Check if this wallet is already linked to another account
      const existingUserWithWallet = await storage.getUserBySolanaAddress(address);
      if (existingUserWithWallet && existingUserWithWallet.id !== user.id) {
        return res.status(409).json({ error: 'This wallet is already linked to another account' });
      }

      // Link the wallet to the user
      const updatedUser = await storage.updateUser(user.id, {
        solanaAddress: address,
      });

      res.json({ 
        success: true, 
        message: 'Wallet linked successfully',
        user: updatedUser 
      });
    } catch (error: any) {
      console.error('API Error:', error);
      res.status(500).json({ error: error.message || String(error) || 'Unknown error' });
    }
  });

  // Check if user has a linked wallet
  app.get('/api/solana/status', async (req, res) => {
    try {
      const privyUserId = req.header('x-privy-user-id');
      if (!privyUserId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await storage.getUserByPrivyId(privyUserId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ 
        hasWallet: !!user.solanaAddress,
        walletAddress: user.solanaAddress || null
      });
    } catch (error: any) {
      console.error('API Error:', error);
      res.status(500).json({ error: error.message || String(error) || 'Unknown error' });
    }
  });

  // Unlink Solana wallet (optional, for users who want to change wallets)
  app.delete('/api/solana/link', async (req, res) => {
    try {
      const privyUserId = req.header('x-privy-user-id');
      if (!privyUserId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await storage.getUserByPrivyId(privyUserId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (!user.solanaAddress) {
        return res.status(400).json({ error: 'No wallet linked' });
      }

      const updatedUser = await storage.updateUser(user.id, {
        solanaAddress: null as any,
      });

      res.json({
        success: true,
        message: 'Wallet unlinked successfully',
        user: updatedUser
      });
    } catch (error: any) {
      console.error('API Error:', error);
      res.status(500).json({ error: error.message || String(error) || 'Unknown error' });
    }
  });

  // ===== MOBILE API ROUTES =====

  // Mobile signup
  app.post('/api/mobile/auth/signup', async (req, res) => {
    try {
      const { email, password, handle } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      // Validate password strength: min 8 chars, 1 uppercase, 1 lowercase, 1 number
      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }
      if (!/[A-Z]/.test(password)) {
        return res.status(400).json({ error: 'Password must contain at least one uppercase letter' });
      }
      if (!/[a-z]/.test(password)) {
        return res.status(400).json({ error: 'Password must contain at least one lowercase letter' });
      }
      if (!/[0-9]/.test(password)) {
        return res.status(400).json({ error: 'Password must contain at least one number' });
      }

      // Check if email already exists
      const allUsers = await storage.getAllUsers();
      const existingEmail = allUsers.find(u => u.email === email);
      if (existingEmail) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Check if handle already exists
      if (handle) {
        const existingHandle = await storage.getUserByHandle(handle);
        if (existingHandle) {
          return res.status(400).json({ error: 'Handle already taken' });
        }
      }

      // Hash password and create user
      const passwordHash = await hashPassword(password);
      const [user] = await (await import('./db')).db.insert((await import('@shared/schema')).users).values([{
        email,
        passwordHash,
        handle: handle || null,
        primaryPlatform: 'mobile' as PlatformType,
      }]).returning();

      const token = generateToken(user.id);

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          handle: user.handle,
          balance: user.balance,
        },
        token,
      });
    } catch (error: any) {
      console.error('API Error:', error);
      res.status(500).json({ error: error.message || String(error) || 'Unknown error' });
    }
  });

  // Mobile login
  app.post('/api/mobile/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Find user by email
      const allUsers = await storage.getAllUsers();
      const user = allUsers.find(u => u.email === email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Verify password
      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const token = generateToken(user.id);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          handle: user.handle,
          balance: user.balance,
        },
        token,
      });
    } catch (error: any) {
      console.error('API Error:', error);
      res.status(500).json({ error: error.message || String(error) || 'Unknown error' });
    }
  });

  // Get current mobile user
  app.get('/api/mobile/auth/me', mobileAuthMiddleware, async (req, res) => {
    try {
      const user = req.mobileUser!;
      res.json({
        id: user.id,
        email: user.email,
        handle: user.handle,
        balance: user.balance,
        totalWagered: user.totalWagered,
        totalWon: user.totalWon,
        correctPredictions: user.correctPredictions,
        totalPredictions: user.totalPredictions,
        currentStreak: user.currentStreak,
        maxStreak: user.maxStreak,
        telegramLinked: !!user.telegramId,
      });
    } catch (error: any) {
      console.error('API Error:', error);
      res.status(500).json({ error: error.message || String(error) || 'Unknown error' });
    }
  });

  // Get active questions (mobile)
  app.get('/api/mobile/questions/active', async (req, res) => {
    try {
      await checkAndRevealQuestions();
      const activeQuestions = await storage.getActiveQuestions();
      res.json(activeQuestions);
    } catch (error: any) {
      console.error('API Error:', error);
      res.status(500).json({ error: error.message || String(error) || 'Unknown error' });
    }
  });

  // Get single question (mobile)
  app.get('/api/mobile/questions/:id', async (req, res) => {
    try {
      const question = await storage.getQuestion(req.params.id);
      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }

      // Get question stats for pool display
      const stats = await storage.getQuestionStats(question.id);

      // Anti-collusion: Only show vote breakdown after question is revealed
      // Before reveal, only show total counts to prevent gaming the rarity multiplier
      const safeStats = question.isRevealed ? {
        totalBets: stats.totalBets,
        totalAmount: stats.totalAmount,
        votesA: stats.votesA,
        votesB: stats.votesB,
        votesC: stats.votesC,
        votesD: stats.votesD,
      } : {
        totalBets: stats.totalBets,
        totalAmount: stats.totalAmount,
        // Hide per-choice breakdown until revealed
      };

      res.json({
        ...question,
        stats: safeStats,
      });
    } catch (error: any) {
      console.error('API Error:', error);
      res.status(500).json({ error: error.message || String(error) || 'Unknown error' });
    }
  });

  // Submit vote with bet (mobile)
  app.post('/api/mobile/votes', mobileAuthMiddleware, async (req, res) => {
    try {
      const user = req.mobileUser!;
      const { questionId, choice, betAmount } = req.body;

      if (!questionId || !choice) {
        return res.status(400).json({ error: 'Question ID and choice are required' });
      }

      const amount = parseFloat(betAmount) || 0;
      if (amount < 0) {
        return res.status(400).json({ error: 'Bet amount must be positive' });
      }

      // Check if question exists and is active
      const question = await storage.getQuestion(questionId);
      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }

      if (!question.isActive || question.isRevealed) {
        return res.status(400).json({ error: 'Question is not open for voting' });
      }

      // Check if user has already voted
      const existingVote = await storage.getVote(user.id, questionId);
      if (existingVote) {
        return res.status(400).json({ error: 'Already voted on this question' });
      }

      // Check balance if betting
      const currentBalance = parseFloat(user.balance);
      if (amount > currentBalance) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      // Create vote with bet
      const vote = await storage.createVoteWithBet({
        userId: user.id,
        questionId,
        choice: choice as VoteChoice,
        betAmount: amount,
        platform: 'mobile',
      });

      // Get updated user
      const updatedUser = await storage.getUser(user.id);

      res.status(201).json({
        vote: serializeBigInt(vote),
        newBalance: updatedUser?.balance || '0.00',
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get my votes (mobile)
  app.get('/api/mobile/votes/mine', mobileAuthMiddleware, async (req, res) => {
    try {
      const user = req.mobileUser!;
      const votes = await storage.getUserVotes(user.id);
      res.json(serializeBigInt(votes));
    } catch (error: any) {
      console.error('API Error:', error);
      res.status(500).json({ error: error.message || String(error) || 'Unknown error' });
    }
  });

  // Get question results (mobile)
  app.get('/api/mobile/results/:id', async (req, res) => {
    try {
      await checkAndRevealQuestions();

      const question = await storage.getQuestion(req.params.id);
      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }

      if (!question.isRevealed) {
        return res.status(403).json({ error: 'Results not yet revealed' });
      }

      const results = await storage.getQuestionResults(req.params.id);
      const stats = await storage.getQuestionStats(req.params.id);

      res.json({
        question,
        results: results ? serializeBigInt(results) : null,
        stats: {
          totalBets: stats.totalBets,
          totalAmount: stats.totalAmount,
          votesA: stats.votesA,
          votesB: stats.votesB,
          votesC: stats.votesC,
          votesD: stats.votesD,
          amountA: stats.amountA,
          amountB: stats.amountB,
          amountC: stats.amountC,
          amountD: stats.amountD,
        },
        correctAnswer: question.correctAnswer,
      });
    } catch (error: any) {
      console.error('API Error:', error);
      res.status(500).json({ error: error.message || String(error) || 'Unknown error' });
    }
  });

  // Get unified leaderboard (mobile)
  app.get('/api/mobile/leaderboard', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const leaders = await storage.getUnifiedLeaderboard(limit);

      // Return public leaderboard data only
      const publicLeaders = leaders.map((user, index) => ({
        rank: index + 1,
        handle: user.handle || user.telegramUsername || `User ${user.id.slice(0, 8)}`,
        balance: user.balance,
        accuracy: user.accuracy,
        correctPredictions: user.correctPredictions,
        totalPredictions: user.totalPredictions,
        currentStreak: user.currentStreak,
        platform: user.primaryPlatform,
      }));

      res.json(publicLeaders);
    } catch (error: any) {
      console.error('API Error:', error);
      res.status(500).json({ error: error.message || String(error) || 'Unknown error' });
    }
  });

  // Get my stats (mobile)
  app.get('/api/mobile/user/stats', mobileAuthMiddleware, async (req, res) => {
    try {
      const user = req.mobileUser!;

      const accuracy = user.totalPredictions > 0
        ? Math.round((user.correctPredictions / user.totalPredictions) * 100)
        : 0;

      const profit = parseFloat(user.totalWon) - parseFloat(user.totalWagered);

      res.json({
        balance: user.balance,
        totalWagered: user.totalWagered,
        totalWon: user.totalWon,
        profit: profit.toFixed(2),
        correctPredictions: user.correctPredictions,
        totalPredictions: user.totalPredictions,
        accuracy,
        currentStreak: user.currentStreak,
        maxStreak: user.maxStreak,
      });
    } catch (error: any) {
      console.error('API Error:', error);
      res.status(500).json({ error: error.message || String(error) || 'Unknown error' });
    }
  });

  // ===== ACCOUNT LINKING ROUTES =====

  // Claim link token (web/mobile)
  app.post('/api/link/claim', async (req, res) => {
    try {
      // Support both Privy auth and mobile JWT auth
      const privyUserId = req.header('x-privy-user-id');
      const authHeader = req.headers.authorization;

      let user;

      if (privyUserId) {
        user = await storage.getUserByPrivyId(privyUserId);
      } else if (authHeader && authHeader.startsWith('Bearer ')) {
        const { verifyToken } = await import('./jwt-auth');
        const token = authHeader.substring(7);
        const payload = verifyToken(token);
        if (payload) {
          user = await storage.getUser(payload.userId);
        }
      }

      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { token } = req.body;
      if (!token || token.length !== 6) {
        return res.status(400).json({ error: 'Valid 6-character code required' });
      }

      // Get the link token
      const linkToken = await storage.getLinkToken(token.toUpperCase());
      if (!linkToken) {
        return res.status(404).json({ error: 'Invalid code' });
      }

      // Check if expired
      if (new Date() > linkToken.expiresAt) {
        return res.status(400).json({ error: 'Code has expired' });
      }

      // Check if already claimed
      if (linkToken.claimedAt) {
        return res.status(400).json({ error: 'Code already used' });
      }

      // Check if this Telegram user is already linked
      const existingTelegramUser = await storage.getUserByTelegramId(linkToken.telegramId);
      if (existingTelegramUser && existingTelegramUser.id !== user.id) {
        // Merge accounts - sum balances and stats
        const mergedBalance = parseFloat(user.balance) + parseFloat(existingTelegramUser.balance);
        const mergedWagered = parseFloat(user.totalWagered) + parseFloat(existingTelegramUser.totalWagered);
        const mergedWon = parseFloat(user.totalWon) + parseFloat(existingTelegramUser.totalWon);
        const mergedCorrect = user.correctPredictions + existingTelegramUser.correctPredictions;
        const mergedTotal = user.totalPredictions + existingTelegramUser.totalPredictions;
        const mergedStreak = Math.max(user.currentStreak, existingTelegramUser.currentStreak);
        const mergedMaxStreak = Math.max(user.maxStreak, existingTelegramUser.maxStreak);

        // Update the web/mobile user with merged data and telegram info
        await storage.updateUser(user.id, {
          telegramId: linkToken.telegramId,
          telegramUsername: linkToken.telegramUsername,
          balance: mergedBalance.toFixed(2),
          totalWagered: mergedWagered.toFixed(2),
          totalWon: mergedWon.toFixed(2),
          correctPredictions: mergedCorrect,
          totalPredictions: mergedTotal,
          currentStreak: mergedStreak,
          maxStreak: mergedMaxStreak,
          linkedAt: new Date(),
        });

        // TODO: Migrate votes from old telegram user to new user
        // For now, we'll just mark the old account as linked

      } else {
        // No existing telegram user or same user - just link
        await storage.updateUser(user.id, {
          telegramId: linkToken.telegramId,
          telegramUsername: linkToken.telegramUsername,
          linkedAt: new Date(),
        });
      }

      // Mark token as claimed
      await storage.claimLinkToken(token.toUpperCase(), user.id);

      const updatedUser = await storage.getUser(user.id);

      res.json({
        success: true,
        message: 'Account linked successfully',
        user: {
          id: updatedUser?.id,
          telegramUsername: updatedUser?.telegramUsername,
          balance: updatedUser?.balance,
        },
      });
    } catch (error: any) {
      console.error('API Error:', error);
      res.status(500).json({ error: error.message || String(error) || 'Unknown error' });
    }
  });

}
