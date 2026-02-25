/**
 * usePoolUpdates Hook
 *
 * React hook for subscribing to real-time pool updates for a question.
 */

import { useState, useEffect, useCallback } from 'react';
import { realtimeClient, type PoolUpdate, type QuestionUpdate } from '../services/api';

interface PoolStats {
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
}

interface UsePoolUpdatesResult {
  stats: PoolStats | null;
  isRevealed: boolean;
  correctAnswer: string | null;
  isConnected: boolean;
}

export function usePoolUpdates(questionId: string | null): UsePoolUpdatesResult {
  const [stats, setStats] = useState<PoolStats | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!questionId) return;

    // Connect to WebSocket
    realtimeClient.connect();
    setIsConnected(true);

    // Subscribe to question updates
    realtimeClient.subscribe(questionId);

    // Listen for updates
    const unsubscribe = realtimeClient.addListener((message) => {
      if (message.type === 'pool_update' && message.questionId === questionId) {
        const poolUpdate = message as PoolUpdate;
        setStats(poolUpdate.stats);
      }

      if (message.type === 'question_revealed' && message.questionId === questionId) {
        const questionUpdate = message as QuestionUpdate;
        setIsRevealed(true);
        setCorrectAnswer(questionUpdate.correctAnswer || null);
      }
    });

    return () => {
      unsubscribe();
      realtimeClient.unsubscribe(questionId);
    };
  }, [questionId]);

  return {
    stats,
    isRevealed,
    correctAnswer,
    isConnected,
  };
}

// Hook for managing WebSocket connection lifecycle
export function useRealtimeConnection(): {
  connect: () => void;
  disconnect: () => void;
  isConnected: boolean;
} {
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    realtimeClient.connect();
    setIsConnected(true);
  }, []);

  const disconnect = useCallback(() => {
    realtimeClient.disconnect();
    setIsConnected(false);
  }, []);

  return { connect, disconnect, isConnected };
}
