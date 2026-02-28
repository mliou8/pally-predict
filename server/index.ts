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
    const { db } = await import('./db');
    const result = await db.execute('SELECT 1 as test');
    res.json({ status: 'connected', result });
  } catch (error: any) {
    console.error('DB debug error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      stack: error.stack,
      name: error.name
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

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window
  message: { error: 'Too many attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to auth routes
app.use('/api/mobile/auth', authLimiter);
app.use('/api/user/profile', authLimiter);

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
