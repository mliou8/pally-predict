/**
 * WebSocket Server for Real-Time Pool Updates
 *
 * Provides real-time updates for betting pools across all platforms.
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { storage } from './storage';

interface PoolUpdate {
  type: 'pool_update';
  questionId: string;
  stats: {
    totalBets: number;
    totalAmount: number;
    votesA: number;
    votesB: number;
    votesC: number;
    votesD: number;
    amountA: number;
    amountB: number;
    amountC: number;
    amountD: number;
  };
}

interface QuestionUpdate {
  type: 'question_revealed' | 'question_activated';
  questionId: string;
  correctAnswer?: string;
}

interface SubscribeMessage {
  type: 'subscribe' | 'unsubscribe';
  questionId: string;
}

type OutgoingMessage = PoolUpdate | QuestionUpdate;

// Store subscriptions: questionId -> Set of WebSocket clients
const subscriptions = new Map<string, Set<WebSocket>>();

let wss: WebSocketServer | null = null;

export function initWebSocket(server: Server): WebSocketServer {
  wss = new WebSocketServer({
    server,
    path: '/ws',
  });

  wss.on('connection', (ws: WebSocket) => {
    console.log('[WebSocket] Client connected');

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString()) as SubscribeMessage;

        if (message.type === 'subscribe' && message.questionId) {
          // Subscribe to question updates
          if (!subscriptions.has(message.questionId)) {
            subscriptions.set(message.questionId, new Set());
          }
          subscriptions.get(message.questionId)!.add(ws);
          console.log(`[WebSocket] Client subscribed to question ${message.questionId}`);

          // Send current stats immediately
          sendCurrentStats(ws, message.questionId);
        }

        if (message.type === 'unsubscribe' && message.questionId) {
          // Unsubscribe from question updates
          const subs = subscriptions.get(message.questionId);
          if (subs) {
            subs.delete(ws);
            if (subs.size === 0) {
              subscriptions.delete(message.questionId);
            }
          }
          console.log(`[WebSocket] Client unsubscribed from question ${message.questionId}`);
        }
      } catch (error) {
        console.error('[WebSocket] Error parsing message:', error);
      }
    });

    ws.on('close', () => {
      // Remove client from all subscriptions
      for (const [questionId, subs] of Array.from(subscriptions.entries())) {
        subs.delete(ws);
        if (subs.size === 0) {
          subscriptions.delete(questionId);
        }
      }
      console.log('[WebSocket] Client disconnected');
    });

    ws.on('error', (error) => {
      console.error('[WebSocket] Error:', error);
    });
  });

  console.log('[WebSocket] Server initialized on /ws path');
  return wss;
}

async function sendCurrentStats(ws: WebSocket, questionId: string): Promise<void> {
  try {
    const question = await storage.getQuestion(questionId);
    const stats = await storage.getQuestionStats(questionId);

    // Anti-collusion: Hide vote breakdown until question is revealed
    const safeStats = question?.isRevealed ? stats : {
      totalBets: stats.totalBets,
      totalAmount: stats.totalAmount,
      votesA: 0,
      votesB: 0,
      votesC: 0,
      votesD: 0,
      amountA: 0,
      amountB: 0,
      amountC: 0,
      amountD: 0,
    };

    const message: PoolUpdate = {
      type: 'pool_update',
      questionId,
      stats: safeStats,
    };
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  } catch (error) {
    console.error('[WebSocket] Error sending current stats:', error);
  }
}

// Broadcast pool update to all subscribers of a question
export async function broadcastPoolUpdate(questionId: string): Promise<void> {
  const subs = subscriptions.get(questionId);
  if (!subs || subs.size === 0) return;

  try {
    const question = await storage.getQuestion(questionId);
    const stats = await storage.getQuestionStats(questionId);

    // Anti-collusion: Hide vote breakdown until question is revealed
    const safeStats = question?.isRevealed ? stats : {
      totalBets: stats.totalBets,
      totalAmount: stats.totalAmount,
      votesA: 0,
      votesB: 0,
      votesC: 0,
      votesD: 0,
      amountA: 0,
      amountB: 0,
      amountC: 0,
      amountD: 0,
    };

    const message: PoolUpdate = {
      type: 'pool_update',
      questionId,
      stats: safeStats,
    };
    const messageStr = JSON.stringify(message);

    for (const ws of Array.from(subs)) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    }
    console.log(`[WebSocket] Broadcasted pool update for question ${questionId} to ${subs.size} clients`);
  } catch (error) {
    console.error('[WebSocket] Error broadcasting pool update:', error);
  }
}

// Broadcast question revealed event
export function broadcastQuestionRevealed(questionId: string, correctAnswer: string): void {
  const subs = subscriptions.get(questionId);
  if (!subs || subs.size === 0) return;

  const message: QuestionUpdate = {
    type: 'question_revealed',
    questionId,
    correctAnswer,
  };
  const messageStr = JSON.stringify(message);

  for (const ws of Array.from(subs)) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(messageStr);
    }
  }
  console.log(`[WebSocket] Broadcasted question revealed for ${questionId}`);
}

// Broadcast to all connected clients (for new questions)
export function broadcastToAll(message: OutgoingMessage): void {
  if (!wss) return;

  const messageStr = JSON.stringify(message);
  for (const ws of Array.from(wss.clients)) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(messageStr);
    }
  }
}

export function getWebSocketServer(): WebSocketServer | null {
  return wss;
}
