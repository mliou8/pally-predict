import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { registerTelegramRoutes } from "./telegram-routes";
import { initBot, getBot } from "./telegram-bot";
import { startScheduler, stopScheduler } from "./telegram-scheduler";
import { initWebSocket } from "./websocket";
import { setupVite, serveStatic, log } from "./vite";

// Add BigInt support to JSON.stringify
(BigInt.prototype as any).toJSON = function() { return this.toString(); };

const app = express();

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

(async () => {
  const server = await registerRoutes(app);

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
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '3000', 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
