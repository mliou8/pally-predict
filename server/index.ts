import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes";
import { registerTelegramRoutes } from "./telegram-routes";
import { initBot, getBot } from "./telegram-bot";
import { startScheduler, stopScheduler } from "./telegram-scheduler";
import { initWebSocket } from "./websocket";
import { setupVite, serveStatic, log } from "./vite";

console.log('[startup] Server initializing...');
console.log('[startup] NODE_ENV:', process.env.NODE_ENV);
console.log('[startup] PORT:', process.env.PORT);
console.log('[startup] DATABASE_URL set:', !!process.env.DATABASE_URL);

// Add BigInt support to JSON.stringify
(BigInt.prototype as any).toJSON = function() { return this.toString(); };

const app = express();

// Health check endpoint - register FIRST before any other middleware/routes
// This ensures healthcheck works even if other parts of the app fail to initialize
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: 'v2', // Version marker to verify deployment
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      DATABASE_URL_SET: !!process.env.DATABASE_URL,
    }
  });
});

// Debug endpoint to test database connection
app.get('/api/debug/db', async (req, res) => {
  try {
    const { pool } = await import('./db');
    const result = await pool.query('SELECT 1 as test');
    res.json({ status: 'connected', rows: result.rows });
  } catch (error: any) {
    console.error('DB debug error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Unknown error',
      name: error.name || 'Error',
      code: error.code
    });
  }
});

// Run migrations endpoint (one-time use)
app.post('/api/admin/migrate', async (req, res) => {
  try {
    const { execSync } = await import('child_process');
    const output = execSync('npm run db:push', {
      encoding: 'utf-8',
      env: process.env as NodeJS.ProcessEnv
    });
    res.json({ status: 'success', output });
  } catch (error: any) {
    console.error('Migration error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      stderr: error.stderr,
      stdout: error.stdout
    });
  }
});

// Reset and seed all questions with correct timing (noon ET each day)
app.post('/api/admin/reset-questions', async (req, res) => {
  try {
    const { db } = await import('./db');
    const { questions } = await import('@shared/schema');
    const { sql } = await import('drizzle-orm');

    // Delete all existing questions
    await db.delete(questions);

    // Seed questions with noon ET times (17:00 UTC for EST, 16:00 UTC for EDT)
    // Currently EST so using 17:00 UTC = noon ET
    const seedData = [
      {
        type: 'prediction' as const,
        prompt: 'By the end of 2026, what will be the biggest impact of AI on white-collar jobs?',
        optionA: 'Universal 4-day work week',
        optionB: 'Massive 30%+ layoffs',
        optionC: 'Human-only work becomes luxury',
        optionD: 'Government bans autonomous AI',
        dropsAt: new Date('2026-02-28T17:00:00.000Z'), // Feb 28 noon ET
        revealsAt: new Date('2026-03-01T17:00:00.000Z'), // March 1 noon ET
        isActive: true,
      },
      {
        type: 'prediction' as const,
        prompt: 'By 2027, how will most people watch their favorite movies and TV shows?',
        optionA: 'Giant Super-App bundles',
        optionB: 'Mandatory commercials for everyone',
        optionC: 'AI-generated personalized shows',
        optionD: 'Resurgence of illegal piracy',
        dropsAt: new Date('2026-03-01T17:00:00.000Z'), // March 1 noon ET
        revealsAt: new Date('2026-03-02T17:00:00.000Z'),
        isActive: true,
      },
      {
        type: 'consensus' as const,
        prompt: 'What will be the coolest way to use social media in 2026?',
        optionA: 'Private, invite-only group chats',
        optionB: 'Raw, unedited ugly content',
        optionC: 'Following realistic AI influencers',
        optionD: 'Quitting all digital platforms',
        dropsAt: new Date('2026-03-02T17:00:00.000Z'), // March 2 noon ET
        revealsAt: new Date('2026-03-03T17:00:00.000Z'),
        isActive: true,
      },
      {
        type: 'prediction' as const,
        prompt: 'What will be the most controversial must-have health trend of 2026?',
        optionA: 'Cheap, universal weight-loss jabs',
        optionB: 'Lab-grown meat only diets',
        optionC: 'Brain-boosting focus implants',
        optionD: 'Mandatory phone-free sleep locks',
        dropsAt: new Date('2026-03-03T17:00:00.000Z'), // March 3 noon ET
        revealsAt: new Date('2026-03-04T17:00:00.000Z'),
        isActive: true,
      },
      {
        type: 'prediction' as const,
        prompt: 'How will the majority of Gen Alpha find their first serious partners?',
        optionA: 'AI agents talk first',
        optionB: 'Meeting at offline clubs',
        optionC: 'Virtual Reality Metaverse dates',
        optionD: 'Matching by DNA compatibility',
        dropsAt: new Date('2026-03-04T17:00:00.000Z'), // March 4 noon ET
        revealsAt: new Date('2026-03-05T17:00:00.000Z'),
        isActive: true,
      },
    ];

    const inserted = await db.insert(questions).values(seedData).returning();
    res.json({ status: 'success', count: inserted.length, questions: inserted });
  } catch (error: any) {
    console.error('Reset questions error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || String(error),
    });
  }
});

// Seed questions endpoint (one-time use)
app.post('/api/admin/seed-questions', async (req, res) => {
  try {
    const { db } = await import('./db');
    const { questions } = await import('@shared/schema');

    // Use 17:00 UTC = 12:00 PM EST (noon Eastern Time)
    const seedData = [
      {
        type: 'prediction' as const,
        prompt: 'By 2027, how will most people watch their favorite movies and TV shows?',
        optionA: 'Giant Super-App bundles',
        optionB: 'Mandatory commercials for everyone',
        optionC: 'AI-generated personalized shows',
        optionD: 'Resurgence of illegal piracy',
        dropsAt: new Date('2026-03-01T17:00:00.000Z'), // noon EST
        revealsAt: new Date('2026-03-02T17:00:00.000Z'), // noon EST next day
        isActive: true,
      },
      {
        type: 'consensus' as const,
        prompt: 'What will be the coolest way to use social media in 2026?',
        optionA: 'Private, invite-only group chats',
        optionB: 'Raw, unedited ugly content',
        optionC: 'Following realistic AI influencers',
        optionD: 'Quitting all digital platforms',
        dropsAt: new Date('2026-03-02T17:00:00.000Z'), // noon EST
        revealsAt: new Date('2026-03-03T17:00:00.000Z'), // noon EST next day
        isActive: true,
      },
      {
        type: 'prediction' as const,
        prompt: 'What will be the most controversial must-have health trend of 2026?',
        optionA: 'Cheap, universal weight-loss jabs',
        optionB: 'Lab-grown meat only diets',
        optionC: 'Brain-boosting focus implants',
        optionD: 'Mandatory phone-free sleep locks',
        dropsAt: new Date('2026-03-03T17:00:00.000Z'), // noon EST
        revealsAt: new Date('2026-03-04T17:00:00.000Z'), // noon EST next day
        isActive: true,
      },
      {
        type: 'prediction' as const,
        prompt: 'How will the majority of Gen Alpha find their first serious partners?',
        optionA: 'AI agents talk first',
        optionB: 'Meeting at offline clubs',
        optionC: 'Virtual Reality Metaverse dates',
        optionD: 'Matching by DNA compatibility',
        dropsAt: new Date('2026-03-04T17:00:00.000Z'), // noon EST
        revealsAt: new Date('2026-03-05T17:00:00.000Z'), // noon EST next day
        isActive: true,
      },
    ];

    const inserted = await db.insert(questions).values(seedData).returning();
    res.json({ status: 'success', count: inserted.length, questions: inserted });
  } catch (error: any) {
    console.error('Seed error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || String(error),
    });
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development - enable in production with proper config
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:5000',
  'http://localhost:5173',
  'https://pally-predict-production.up.railway.app',
  'https://www.pallyfeud.com',
  'https://pallyfeud.com',
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Rate limiting for auth endpoints (strict)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window
  message: { error: 'Too many attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for voting/wagering (moderate)
const voteLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: { error: 'Too many vote attempts, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for admin endpoints (strict)
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: 'Too many admin requests' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for wallet operations (strict)
const walletLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 requests per window
  message: { error: 'Too many wallet operations, please wait' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to routes
app.use('/api/mobile/auth', authLimiter);
app.use('/api/user/profile', authLimiter);
app.use('/api/votes', voteLimiter);
app.use('/api/wager', voteLimiter);
app.use('/api/mobile/votes', voteLimiter);
app.use('/api/admin', adminLimiter);
app.use('/api/telegram/admin', adminLimiter);
app.use('/api/solana', walletLimiter);

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Start the HTTP server FIRST to ensure healthcheck can respond
import { createServer } from 'http';
const server = createServer(app);
const port = parseInt(process.env.PORT || '3000', 10);

server.listen(port, "0.0.0.0", () => {
  console.log(`[startup] Server listening on port ${port}`);
  log(`serving on port ${port}`);
});

// Initialize everything else in the background
(async () => {
  try {
    // Run auto-migrations to add any missing columns
    console.log('[startup] Running auto-migrations...');
    const { runAutoMigrations } = await import('./db');
    await runAutoMigrations();

    console.log('[startup] Registering routes...');
    await registerRoutes(app, server);
    console.log('[startup] Routes registered');

    // Initialize WebSocket server for real-time updates
    initWebSocket(server);
    log('WebSocket server initialized on /ws');

    // Register Telegram admin routes
    registerTelegramRoutes(app);

    // Initialize Telegram bot if token is provided
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    if (telegramBotToken) {
      try {
        const bot = initBot(telegramBotToken);

        // Start bot in polling mode (for development)
        // In production, you'd use webhooks instead
        bot.launch().then(() => {
          log('Telegram bot started successfully');
        }).catch((err) => {
          console.error('Failed to start Telegram bot:', err);
        });

        // Start the scheduler for automatic question sending
        startScheduler();

        // Graceful shutdown
        process.once('SIGINT', () => {
          stopScheduler();
          bot.stop('SIGINT');
        });
        process.once('SIGTERM', () => {
          stopScheduler();
          bot.stop('SIGTERM');
        });
      } catch (err) {
        console.error('Failed to initialize Telegram bot:', err);
      }
    } else {
      log('TELEGRAM_BOT_TOKEN not set - Telegram bot disabled');
    }

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      console.error('Unhandled error:', err);
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      try {
        serveStatic(app);
      } catch (err) {
        console.error('[startup] Failed to serve static files:', err);
        // Still continue - API will work even if static files fail
      }
    }

    console.log('[startup] Initialization complete');
  } catch (err) {
    console.error('[startup] Critical initialization error:', err);
    // Don't exit - let the healthcheck still work
  }
})();
