import { Telegraf, Markup, Context } from 'telegraf';
import { telegramStorage } from './telegram-storage';
import { storage } from './storage';
import type { Question, User, VoteChoice } from '@shared/schema';

// Create bot instance (initialized later with token)
let bot: Telegraf | null = null;

// Track active bet sessions
interface BetSession {
  questionId: string;
  choice: 'A' | 'B' | 'C' | 'D';
  awaitingAmount: boolean;
}
const betSessions = new Map<string, BetSession>();

// Format currency
const formatMoney = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `$${num.toFixed(2)}`;
};

// Format question for display
const formatQuestion = (question: Question): string => {
  let text = `🎯 *Today's Prediction*\n\n`;
  text += `${question.prompt}\n\n`;

  if (question.context) {
    text += `_${question.context}_\n\n`;
  }

  text += `*Options:*\n`;
  text += `🅰️ ${question.optionA}\n`;
  text += `🅱️ ${question.optionB}\n`;

  if (question.optionC) {
    text += `🇨 ${question.optionC}\n`;
  }
  if (question.optionD) {
    text += `🇩 ${question.optionD}\n`;
  }

  const expiresAt = new Date(question.revealsAt);
  const now = new Date();
  const hoursLeft = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)));
  const minutesLeft = Math.max(0, Math.floor(((expiresAt.getTime() - now.getTime()) % (1000 * 60 * 60)) / (1000 * 60)));

  text += `\n⏰ *Voting closes in:* ${hoursLeft}h ${minutesLeft}m`;

  return text;
};

// Format results for display
const formatResults = async (question: Question): Promise<string> => {
  const stats = await telegramStorage.getQuestionStats(question.id);
  const totalVotes = stats.totalBets;

  let text = `📊 *Results*\n\n`;
  text += `*Question:* ${question.prompt}\n\n`;

  const getPercentage = (votes: number) => totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : '0.0';
  const getBar = (votes: number) => {
    const pct = totalVotes > 0 ? (votes / totalVotes) : 0;
    const filled = Math.round(pct * 10);
    return '█'.repeat(filled) + '░'.repeat(10 - filled);
  };

  const correctEmoji = question.correctAnswer;

  text += `🅰️ ${question.optionA}\n`;
  text += `${getBar(stats.votesA)} ${getPercentage(stats.votesA)}% (${stats.votesA} votes, ${formatMoney(stats.amountA)})`;
  if (correctEmoji === 'A') text += ` ✅`;
  text += `\n\n`;

  text += `🅱️ ${question.optionB}\n`;
  text += `${getBar(stats.votesB)} ${getPercentage(stats.votesB)}% (${stats.votesB} votes, ${formatMoney(stats.amountB)})`;
  if (correctEmoji === 'B') text += ` ✅`;
  text += `\n\n`;

  if (question.optionC) {
    text += `🇨 ${question.optionC}\n`;
    text += `${getBar(stats.votesC)} ${getPercentage(stats.votesC)}% (${stats.votesC} votes, ${formatMoney(stats.amountC)})`;
    if (correctEmoji === 'C') text += ` ✅`;
    text += `\n\n`;
  }

  if (question.optionD) {
    text += `🇩 ${question.optionD}\n`;
    text += `${getBar(stats.votesD)} ${getPercentage(stats.votesD)}% (${stats.votesD} votes, ${formatMoney(stats.amountD)})`;
    if (correctEmoji === 'D') text += ` ✅`;
    text += `\n\n`;
  }

  text += `💰 *Total pot:* ${formatMoney(stats.totalAmount)}\n`;
  text += `👥 *Total votes:* ${totalVotes}`;

  return text;
};

// Get the Mini App URL from environment
const getMiniAppUrl = (): string => {
  const baseUrl = process.env.APP_URL || process.env.REPL_SLUG
    ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
    : 'https://pallypredict.com';
  return `${baseUrl}/telegram.html`;
};

// Initialize the bot with token
export function initBot(token: string): Telegraf {
  bot = new Telegraf(token);

  // /start command - Register user
  bot.start(async (ctx) => {
    const telegramId = ctx.from.id.toString();

    try {
      let user = await telegramStorage.getUserByTelegramId(telegramId);

      if (!user) {
        // Create new user with $500 starting balance
        user = await telegramStorage.createUser({
          telegramId,
          username: ctx.from.username || null,
          firstName: ctx.from.first_name || null,
          lastName: ctx.from.last_name || null,
        });

        await ctx.replyWithMarkdown(
          `🎉 *Welcome to Pally Predict!*\n\n` +
          `You've been credited with *${formatMoney(user.balance)}* testnet dollars to start betting!\n\n` +
          `Here's how it works:\n` +
          `1️⃣ Every day you'll receive a new prediction question\n` +
          `2️⃣ Vote on your prediction and place a bet\n` +
          `3️⃣ Results are revealed the next day\n` +
          `4️⃣ Winners split the pot proportionally!\n\n` +
          `Use /question to see today's question\n` +
          `Use /balance to check your balance\n` +
          `Use /play to open the full game experience`,
          Markup.inlineKeyboard([
            [Markup.button.webApp('🎮 Open Game', getMiniAppUrl())],
          ])
        );
      } else {
        await ctx.replyWithMarkdown(
          `👋 *Welcome back!*\n\n` +
          `Your balance: *${formatMoney(user.balance)}*\n\n` +
          `Use /question to see today's question!`,
          Markup.inlineKeyboard([
            [Markup.button.webApp('🎮 Open Game', getMiniAppUrl())],
          ])
        );
      }
    } catch (error) {
      console.error('Error in /start:', error);
      await ctx.reply('Something went wrong. Please try again later.');
    }
  });

  // /play command - Open Mini App
  bot.command('play', async (ctx) => {
    try {
      const telegramId = ctx.from.id.toString();
      let user = await telegramStorage.getUserByTelegramId(telegramId);

      if (!user) {
        await ctx.reply('Please use /start to register first!');
        return;
      }

      await ctx.replyWithMarkdown(
        `🎮 *Open Pally Predict*\n\n` +
        `Tap the button below to play with the full game experience!`,
        Markup.inlineKeyboard([
          [Markup.button.webApp('🎮 Play Now', getMiniAppUrl())],
        ])
      );
    } catch (error) {
      console.error('Error in /play:', error);
      await ctx.reply('Something went wrong. Please try again later.');
    }
  });

  // /question command - Show today's question
  bot.command('question', async (ctx) => {
    try {
      const question = await telegramStorage.getActiveQuestion();
      
      if (!question) {
        await ctx.replyWithMarkdown(
          `😴 *No active question right now*\n\n` +
          `Check back later for the next prediction question!`
        );
        return;
      }
      
      const telegramId = ctx.from.id.toString();
      const user = await telegramStorage.getUserByTelegramId(telegramId);
      
      if (!user) {
        await ctx.reply('Please use /start to register first!');
        return;
      }
      
      // Check if user already bet
      const existingBet = await telegramStorage.getBet(user.id, question.id);
      
      if (existingBet) {
        await ctx.replyWithMarkdown(
          formatQuestion(question) + `\n\n` +
          `✅ *You already voted:* Option ${existingBet.choice} with ${formatMoney(existingBet.betAmount)}\n\n` +
          `Results will be revealed tomorrow!`
        );
        return;
      }
      
      // Build option buttons
      const buttons = [
        [
          Markup.button.callback('🅰️ Vote A', `vote_A_${question.id}`),
          Markup.button.callback('🅱️ Vote B', `vote_B_${question.id}`),
        ],
      ];
      
      if (question.optionC) {
        buttons.push([
          Markup.button.callback('🇨 Vote C', `vote_C_${question.id}`),
          question.optionD 
            ? Markup.button.callback('🇩 Vote D', `vote_D_${question.id}`)
            : Markup.button.callback(' ', 'noop'),
        ]);
      }
      
      await ctx.replyWithMarkdown(
        formatQuestion(question) + `\n\n` +
        `💰 *Your balance:* ${formatMoney(user.balance)}\n\n` +
        `Select your prediction:`,
        Markup.inlineKeyboard(buttons)
      );
    } catch (error) {
      console.error('Error in /question:', error);
      await ctx.reply('Something went wrong. Please try again later.');
    }
  });

  // /balance command
  bot.command('balance', async (ctx) => {
    try {
      const telegramId = ctx.from.id.toString();
      const user = await telegramStorage.getUserByTelegramId(telegramId);
      
      if (!user) {
        await ctx.reply('Please use /start to register first!');
        return;
      }
      
      await ctx.replyWithMarkdown(
        `💰 *Your Balance*\n\n` +
        `Available: *${formatMoney(user.balance)}*\n` +
        `Total wagered: ${formatMoney(user.totalWagered)}\n` +
        `Total won: ${formatMoney(user.totalWon)}`
      );
    } catch (error) {
      console.error('Error in /balance:', error);
      await ctx.reply('Something went wrong. Please try again later.');
    }
  });

  // /stats command
  bot.command('stats', async (ctx) => {
    try {
      const telegramId = ctx.from.id.toString();
      const user = await telegramStorage.getUserByTelegramId(telegramId);
      
      if (!user) {
        await ctx.reply('Please use /start to register first!');
        return;
      }
      
      const accuracy = user.totalPredictions > 0 
        ? ((user.correctPredictions / user.totalPredictions) * 100).toFixed(1)
        : '0.0';
      
      const profit = parseFloat(user.totalWon) - parseFloat(user.totalWagered);
      
      await ctx.replyWithMarkdown(
        `📊 *Your Stats*\n\n` +
        `💰 Balance: *${formatMoney(user.balance)}*\n` +
        `📈 Profit/Loss: *${profit >= 0 ? '+' : ''}${formatMoney(profit)}*\n\n` +
        `🎯 Predictions: ${user.totalPredictions}\n` +
        `✅ Correct: ${user.correctPredictions}\n` +
        `📊 Accuracy: ${accuracy}%\n\n` +
        `🔥 Current streak: ${user.currentStreak}\n` +
        `⭐ Max streak: ${user.maxStreak}`
      );
    } catch (error) {
      console.error('Error in /stats:', error);
      await ctx.reply('Something went wrong. Please try again later.');
    }
  });

  // /leaderboard command
  bot.command('leaderboard', async (ctx) => {
    try {
      const leaders = await telegramStorage.getLeaderboard(10);
      
      if (leaders.length === 0) {
        await ctx.replyWithMarkdown('🏆 *Leaderboard*\n\nNo players yet!');
        return;
      }
      
      let text = `🏆 *Leaderboard*\n\n`;
      
      const medals = ['🥇', '🥈', '🥉'];
      
      leaders.forEach((user, index) => {
        const medal = medals[index] || `${index + 1}.`;
        const name = user.telegramUsername ? `@${user.telegramUsername}` : user.firstName || user.handle || 'Anonymous';
        text += `${medal} ${name}: *${formatMoney(user.balance)}*\n`;
      });
      
      await ctx.replyWithMarkdown(text);
    } catch (error) {
      console.error('Error in /leaderboard:', error);
      await ctx.reply('Something went wrong. Please try again later.');
    }
  });

  // /history command - Show past questions
  bot.command('history', async (ctx) => {
    try {
      const telegramId = ctx.from.id.toString();
      const user = await telegramStorage.getUserByTelegramId(telegramId);
      
      if (!user) {
        await ctx.reply('Please use /start to register first!');
        return;
      }
      
      const bets = await telegramStorage.getUserBets(user.id);
      
      if (bets.length === 0) {
        await ctx.replyWithMarkdown('📜 *Your History*\n\nNo bets yet! Use /question to make your first prediction.');
        return;
      }
      
      let text = `📜 *Your Recent Bets*\n\n`;
      
      for (const bet of bets.slice(0, 5)) {
        const question = await telegramStorage.getQuestion(bet.questionId);
        if (!question) continue;
        
        const resultEmoji = bet.isCorrect === true ? '✅' : bet.isCorrect === false ? '❌' : '⏳';
        const payoutText = bet.payout ? ` → ${formatMoney(bet.payout)}` : '';
        
        text += `${resultEmoji} *${question.prompt.slice(0, 50)}...*\n`;
        text += `   Your pick: ${bet.choice} (${formatMoney(bet.betAmount)})${payoutText}\n\n`;
      }
      
      await ctx.replyWithMarkdown(text);
    } catch (error) {
      console.error('Error in /history:', error);
      await ctx.reply('Something went wrong. Please try again later.');
    }
  });

  // /help command
  bot.command('help', async (ctx) => {
    await ctx.replyWithMarkdown(
      `📖 *Pally Predict Help*\n\n` +
      `*Commands:*\n` +
      `/start - Register and get $500 to start\n` +
      `/play - Open the full game experience\n` +
      `/question - See today's prediction question\n` +
      `/balance - Check your balance\n` +
      `/stats - View your stats and accuracy\n` +
      `/leaderboard - See top players\n` +
      `/history - View your past bets\n` +
      `/link - Link your account to web/mobile\n` +
      `/help - Show this help message\n\n` +
      `*How it works:*\n` +
      `1. Vote on the daily prediction question\n` +
      `2. Place a bet (minimum $1)\n` +
      `3. Winners split the pot proportionally\n` +
      `4. Results are revealed the next day!`,
      Markup.inlineKeyboard([
        [Markup.button.webApp('🎮 Open Game', getMiniAppUrl())],
      ])
    );
  });

  // /link command - Generate account link code
  bot.command('link', async (ctx) => {
    try {
      const telegramId = ctx.from.id.toString();
      const user = await telegramStorage.getUserByTelegramId(telegramId);

      if (!user) {
        await ctx.reply('Please use /start to register first!');
        return;
      }

      // Check if already linked to a web/mobile account
      if (user.privyUserId) {
        await ctx.replyWithMarkdown(
          `✅ *Account Already Linked*\n\n` +
          `Your Telegram account is already connected to a web/mobile account.\n\n` +
          `You can access your account on pallypredict.com with the same balance and stats!`
        );
        return;
      }

      // Generate a 6-character link code
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let token = '';
      for (let i = 0; i < 6; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Set expiration to 10 minutes from now
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      // Store the link token
      await storage.createLinkToken({
        token,
        telegramId,
        telegramUsername: ctx.from.username || null,
        expiresAt,
      });

      await ctx.replyWithMarkdown(
        `🔗 *Link Your Account*\n\n` +
        `Your link code is: *${token}*\n\n` +
        `To connect your Telegram account to web/mobile:\n\n` +
        `1️⃣ Go to pallypredict.com/link\n` +
        `2️⃣ Sign in or create an account\n` +
        `3️⃣ Enter the code: *${token}*\n\n` +
        `⏰ This code expires in *10 minutes*.\n\n` +
        `After linking, your balance and stats will be merged!`
      );
    } catch (error) {
      console.error('Error in /link:', error);
      await ctx.reply('Something went wrong. Please try again later.');
    }
  });

  // Handle vote button callbacks
  bot.action(/vote_([ABCD])_(.+)/, async (ctx) => {
    try {
      const choice = ctx.match[1] as 'A' | 'B' | 'C' | 'D';
      const questionId = ctx.match[2];
      const telegramId = ctx.from!.id.toString();
      
      const user = await telegramStorage.getUserByTelegramId(telegramId);
      if (!user) {
        await ctx.answerCbQuery('Please use /start to register first!');
        return;
      }
      
      const question = await telegramStorage.getQuestion(questionId);
      if (!question || !question.isActive) {
        await ctx.answerCbQuery('This question is no longer active.');
        return;
      }
      
      // Check if already voted
      const existingBet = await telegramStorage.getBet(user.id, questionId);
      if (existingBet) {
        await ctx.answerCbQuery('You already voted on this question!');
        return;
      }
      
      // Store bet session
      betSessions.set(telegramId, {
        questionId,
        choice,
        awaitingAmount: true,
      });
      
      await ctx.answerCbQuery(`Selected option ${choice}`);
      
      // Ask for bet amount
      const optionText = choice === 'A' ? question.optionA 
        : choice === 'B' ? question.optionB
        : choice === 'C' ? question.optionC
        : question.optionD;
      
      await ctx.editMessageText(
        `🎯 *Your pick:* ${choice} - ${optionText}\n\n` +
        `💰 *Your balance:* ${formatMoney(user.balance)}\n\n` +
        `How much do you want to bet? (Min: $1)\n\n` +
        `_Reply with a number (e.g., 50 or 100)_`,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      console.error('Error in vote callback:', error);
      await ctx.answerCbQuery('Something went wrong. Please try again.');
    }
  });

  // Handle bet amount input
  bot.on('text', async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const session = betSessions.get(telegramId);
    
    if (!session || !session.awaitingAmount) {
      // Not in a bet session, ignore
      return;
    }
    
    try {
      const amount = parseFloat(ctx.message.text.replace('$', '').trim());
      
      if (isNaN(amount) || amount < 1) {
        await ctx.reply('Please enter a valid amount (minimum $1)');
        return;
      }
      
      const user = await telegramStorage.getUserByTelegramId(telegramId);
      if (!user) {
        betSessions.delete(telegramId);
        await ctx.reply('Please use /start to register first!');
        return;
      }
      
      const balance = parseFloat(user.balance);
      if (amount > balance) {
        await ctx.reply(`Insufficient balance. You have ${formatMoney(balance)}`);
        return;
      }
      
      const question = await telegramStorage.getQuestion(session.questionId);
      if (!question || !question.isActive) {
        betSessions.delete(telegramId);
        await ctx.reply('This question is no longer active.');
        return;
      }
      
      // Check again if already voted
      const existingBet = await telegramStorage.getBet(user.id, session.questionId);
      if (existingBet) {
        betSessions.delete(telegramId);
        await ctx.reply('You already voted on this question!');
        return;
      }
      
      // Deduct from balance
      await telegramStorage.updateUser(user.id, {
        balance: (balance - amount).toFixed(2),
        totalWagered: (parseFloat(user.totalWagered) + amount).toFixed(2),
      });
      
      // Create bet
      await telegramStorage.createBet({
        userId: user.id,
        questionId: session.questionId,
        choice: session.choice,
        betAmount: amount.toFixed(2),
      });
      
      betSessions.delete(telegramId);
      
      const optionText = session.choice === 'A' ? question.optionA 
        : session.choice === 'B' ? question.optionB
        : session.choice === 'C' ? question.optionC
        : question.optionD;
      
      await ctx.replyWithMarkdown(
        `✅ *Bet placed!*\n\n` +
        `🎯 Your pick: *${session.choice} - ${optionText}*\n` +
        `💵 Bet amount: *${formatMoney(amount)}*\n` +
        `💰 Remaining balance: *${formatMoney(balance - amount)}*\n\n` +
        `Results will be revealed tomorrow! Good luck! 🍀`
      );
    } catch (error) {
      console.error('Error placing bet:', error);
      betSessions.delete(telegramId);
      await ctx.reply('Something went wrong. Please try again with /question');
    }
  });

  // Handle noop button
  bot.action('noop', (ctx) => ctx.answerCbQuery());

  return bot;
}

// Send question to all users
export async function broadcastQuestion(question: Question): Promise<number> {
  if (!bot) {
    console.error('Bot not initialized');
    return 0;
  }

  const users = await telegramStorage.getAllUsers();
  let sentCount = 0;

  const buttons = [
    [
      Markup.button.callback('🅰️ Vote A', `vote_A_${question.id}`),
      Markup.button.callback('🅱️ Vote B', `vote_B_${question.id}`),
    ],
  ];

  if (question.optionC) {
    buttons.push([
      Markup.button.callback('🇨 Vote C', `vote_C_${question.id}`),
      question.optionD
        ? Markup.button.callback('🇩 Vote D', `vote_D_${question.id}`)
        : Markup.button.callback(' ', 'noop'),
    ]);
  }

  for (const user of users) {
    if (!user.telegramId) continue;
    try {
      await bot.telegram.sendMessage(
        user.telegramId,
        `🔔 *New prediction question!*\n\n` + formatQuestion(question),
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard(buttons),
        }
      );
      sentCount++;

      // Rate limiting - Telegram allows 30 messages/second
      await new Promise(resolve => setTimeout(resolve, 35));
    } catch (error) {
      console.error(`Failed to send to user ${user.telegramId}:`, error);
    }
  }

  return sentCount;
}

// Send results to all users who participated
export async function broadcastResults(question: Question): Promise<number> {
  if (!bot) {
    console.error('Bot not initialized');
    return 0;
  }

  const bets = await telegramStorage.getQuestionBets(question.id);
  const userIds = Array.from(new Set(bets.map(b => b.userId)));
  let sentCount = 0;

  const resultsText = await formatResults(question);

  for (const oderId of userIds) {
    try {
      const user = await telegramStorage.getUser(oderId);
      if (!user || !user.telegramId) continue;

      const bet = bets.find(b => b.userId === oderId);
      if (!bet) continue;

      let personalMessage = resultsText + `\n\n`;

      if (bet.isCorrect) {
        personalMessage += `🎉 *Congratulations!* You won *${formatMoney(bet.payout || '0')}*!`;
      } else {
        personalMessage += `😔 Better luck next time! You lost *${formatMoney(bet.betAmount)}*.`;
      }

      personalMessage += `\n\n💰 Your new balance: *${formatMoney(user.balance)}*`;

      await bot.telegram.sendMessage(user.telegramId, personalMessage, {
        parse_mode: 'Markdown',
      });
      sentCount++;

      await new Promise(resolve => setTimeout(resolve, 35));
    } catch (error) {
      console.error(`Failed to send results to user ${oderId}:`, error);
    }
  }

  return sentCount;
}

// Get bot instance
export function getBot(): Telegraf | null {
  return bot;
}

// Stop bot
export async function stopBot(): Promise<void> {
  if (bot) {
    await bot.stop();
    bot = null;
  }
}

