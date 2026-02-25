/**
 * Pally Predict Mobile API Service
 *
 * Typed API client for the Pally Predict mobile app.
 * Handles authentication, API calls, and real-time WebSocket connections.
 */

// Base configuration - update this for production
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');

// Token storage interface - implement with SecureStore or AsyncStorage
let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

// API response types
export interface User {
  id: string;
  email?: string;
  handle?: string;
  balance: string;
  totalWagered: string;
  totalWon: string;
  correctPredictions: number;
  totalPredictions: number;
  currentStreak: number;
  maxStreak: number;
  telegramLinked?: boolean;
}

export interface Question {
  id: string;
  type: string;
  prompt: string;
  optionA: string;
  optionB: string;
  optionC?: string | null;
  optionD?: string | null;
  context?: string | null;
  dropsAt: string;
  revealsAt: string;
  isActive: boolean;
  isRevealed: boolean;
  correctAnswer?: string | null;
}

export interface QuestionWithStats extends Question {
  stats: {
    totalBets: number;
    totalAmount: number;
    votesA: number;
    votesB: number;
    votesC: number;
    votesD: number;
  };
}

export interface Vote {
  id: string;
  userId: string;
  questionId: string;
  choice: 'A' | 'B' | 'C' | 'D';
  betAmount: string;
  payout?: string | null;
  isCorrect?: boolean | null;
  platform: string;
  votedAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  handle: string;
  balance: string;
  accuracy: number;
  correctPredictions: number;
  totalPredictions: number;
  currentStreak: number;
  platform: string;
}

export interface UserStats {
  balance: string;
  totalWagered: string;
  totalWon: string;
  profit: string;
  correctPredictions: number;
  totalPredictions: number;
  accuracy: number;
  currentStreak: number;
  maxStreak: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface VoteResponse {
  vote: Vote;
  newBalance: string;
}

export interface QuestionResults {
  question: Question;
  results: any;
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
  correctAnswer?: string | null;
}

// API Error class
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// Generic fetch wrapper
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(data.error || 'API request failed', response.status);
  }

  return data as T;
}

// ===== AUTH API =====

export async function signup(
  email: string,
  password: string,
  handle?: string
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/mobile/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, handle }),
  });
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/mobile/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getCurrentUser(): Promise<User> {
  return apiFetch<User>('/api/mobile/auth/me');
}

// ===== QUESTIONS API =====

export async function getActiveQuestions(): Promise<Question[]> {
  return apiFetch<Question[]>('/api/mobile/questions/active');
}

export async function getQuestion(id: string): Promise<QuestionWithStats> {
  return apiFetch<QuestionWithStats>(`/api/mobile/questions/${id}`);
}

export async function getQuestionResults(id: string): Promise<QuestionResults> {
  return apiFetch<QuestionResults>(`/api/mobile/results/${id}`);
}

// ===== VOTES API =====

export async function submitVote(
  questionId: string,
  choice: 'A' | 'B' | 'C' | 'D',
  betAmount: number
): Promise<VoteResponse> {
  return apiFetch<VoteResponse>('/api/mobile/votes', {
    method: 'POST',
    body: JSON.stringify({ questionId, choice, betAmount }),
  });
}

export async function getMyVotes(): Promise<Vote[]> {
  return apiFetch<Vote[]>('/api/mobile/votes/mine');
}

// ===== LEADERBOARD & STATS =====

export async function getLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  return apiFetch<LeaderboardEntry[]>(`/api/mobile/leaderboard?limit=${limit}`);
}

export async function getUserStats(): Promise<UserStats> {
  return apiFetch<UserStats>('/api/mobile/user/stats');
}

// ===== ACCOUNT LINKING =====

export async function claimLinkToken(token: string): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>('/api/link/claim', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

// ===== WEBSOCKET FOR REAL-TIME UPDATES =====

export interface PoolUpdate {
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

export interface QuestionUpdate {
  type: 'question_revealed' | 'question_activated';
  questionId: string;
  correctAnswer?: string;
}

type WebSocketMessage = PoolUpdate | QuestionUpdate;

export class RealtimeClient {
  private ws: WebSocket | null = null;
  private subscriptions = new Set<string>();
  private listeners: ((message: WebSocketMessage) => void)[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    try {
      this.ws = new WebSocket(`${WS_BASE_URL}/ws`);

      this.ws.onopen = () => {
        console.log('[WebSocket] Connected');
        this.reconnectAttempts = 0;

        // Re-subscribe to all questions
        for (const questionId of this.subscriptions) {
          this.sendSubscribe(questionId);
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          this.listeners.forEach((listener) => listener(message));
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('[WebSocket] Disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
      };
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[WebSocket] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => this.connect(), delay);
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscriptions.clear();
  }

  private sendSubscribe(questionId: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'subscribe', questionId }));
    }
  }

  private sendUnsubscribe(questionId: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'unsubscribe', questionId }));
    }
  }

  subscribe(questionId: string): void {
    this.subscriptions.add(questionId);
    this.sendSubscribe(questionId);
  }

  unsubscribe(questionId: string): void {
    this.subscriptions.delete(questionId);
    this.sendUnsubscribe(questionId);
  }

  addListener(listener: (message: WebSocketMessage) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }
}

// Singleton instance
export const realtimeClient = new RealtimeClient();
