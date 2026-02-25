import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, Flame, Target, Trophy, TrendingUp, Wallet, History } from 'lucide-react';
import Colors from '@/constants/colors';
import { cn } from '@/lib/utils';
import { useTelegram } from '@/contexts/TelegramContext';

interface TelegramUserProfile {
  id: string;
  telegramId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  balance: string;
  totalWagered: string;
  totalWon: string;
  totalPredictions: number;
  correctPredictions: number;
  currentStreak: number;
  maxStreak: number;
  createdAt: string;
}

interface RecentBet {
  id: string;
  questionPrompt: string;
  choice: string;
  betAmount: string;
  isCorrect: boolean | null;
  payout: string | null;
  createdAt: string;
}

export default function TelegramProfile() {
  const { initData, user: telegramUser } = useTelegram();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const { data: profile, isLoading } = useQuery<TelegramUserProfile>({
    queryKey: ['/api/telegram/user'],
    queryFn: async () => {
      const response = await fetch('/api/telegram/user', {
        headers: { 'X-Telegram-Init-Data': initData },
      });
      if (!response.ok) throw new Error('Failed to fetch profile');
      return response.json();
    },
    enabled: !!initData,
  });

  const { data: recentBets = [] } = useQuery<RecentBet[]>({
    queryKey: ['/api/telegram/bets/recent'],
    queryFn: async () => {
      const response = await fetch('/api/telegram/bets/recent', {
        headers: { 'X-Telegram-Init-Data': initData },
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!initData,
  });

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: Colors.dark.background }}>
        <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: Colors.dark.accent, borderTopColor: 'transparent' }} />
      </div>
    );
  }

  const balance = parseFloat(profile.balance);
  const totalWagered = parseFloat(profile.totalWagered);
  const totalWon = parseFloat(profile.totalWon);
  const profit = totalWon - totalWagered;
  const accuracy = profile.totalPredictions > 0
    ? Math.round((profile.correctPredictions / profile.totalPredictions) * 100)
    : 0;

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: Colors.dark.background }}>
      <div className="max-w-lg mx-auto px-5 py-6">
        {/* Profile Header */}
        <div
          className={cn(
            'flex flex-col items-center mb-8 transition-all duration-400',
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: Colors.dark.accentDim }}
          >
            {telegramUser?.photo_url ? (
              <img
                src={telegramUser.photo_url}
                alt="Profile"
                className="w-full h-full rounded-2xl object-cover"
              />
            ) : (
              <User size={36} color={Colors.dark.accent} />
            )}
          </div>
          <h1 className="text-2xl font-extrabold mb-1" style={{ color: Colors.dark.text }}>
            {profile.firstName || profile.username || 'Player'}
          </h1>
          {profile.username && (
            <p className="text-sm" style={{ color: Colors.dark.textMuted }}>
              @{profile.username}
            </p>
          )}
        </div>

        {/* Balance Card */}
        <div
          className={cn(
            'rounded-2xl p-5 border mb-4 transition-all duration-400',
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
          style={{
            backgroundColor: Colors.dark.surface,
            borderColor: Colors.dark.border,
            transitionDelay: '100ms',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet size={16} color={Colors.dark.accent} />
              <span className="text-sm font-semibold" style={{ color: Colors.dark.textMuted }}>
                Balance
              </span>
            </div>
            <span
              className={cn('text-sm font-bold', profit >= 0 ? 'text-green-400' : 'text-red-400')}
            >
              {profit >= 0 ? '+' : ''}{profit.toFixed(2)} profit
            </span>
          </div>
          <div className="text-4xl font-black tabular-nums" style={{ color: Colors.dark.text }}>
            ${balance.toFixed(2)}
          </div>
        </div>

        {/* Stats Grid */}
        <div
          className={cn(
            'grid grid-cols-2 gap-3 mb-6 transition-all duration-400',
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
          style={{ transitionDelay: '200ms' }}
        >
          <div
            className="rounded-xl p-4 border"
            style={{ backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Target size={14} color={Colors.dark.blue} />
              <span className="text-xs font-medium" style={{ color: Colors.dark.textMuted }}>
                Accuracy
              </span>
            </div>
            <div className="text-2xl font-extrabold" style={{ color: Colors.dark.text }}>
              {accuracy}%
            </div>
            <div className="text-xs" style={{ color: Colors.dark.textMuted }}>
              {profile.correctPredictions}/{profile.totalPredictions} correct
            </div>
          </div>

          <div
            className="rounded-xl p-4 border"
            style={{ backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Flame size={14} color={Colors.dark.warning} />
              <span className="text-xs font-medium" style={{ color: Colors.dark.textMuted }}>
                Streak
              </span>
            </div>
            <div className="text-2xl font-extrabold" style={{ color: Colors.dark.warning }}>
              {profile.currentStreak}
            </div>
            <div className="text-xs" style={{ color: Colors.dark.textMuted }}>
              Best: {profile.maxStreak}
            </div>
          </div>

          <div
            className="rounded-xl p-4 border"
            style={{ backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border }}
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} color={Colors.dark.success} />
              <span className="text-xs font-medium" style={{ color: Colors.dark.textMuted }}>
                Total Won
              </span>
            </div>
            <div className="text-2xl font-extrabold" style={{ color: Colors.dark.success }}>
              ${totalWon.toFixed(0)}
            </div>
          </div>

          <div
            className="rounded-xl p-4 border"
            style={{ backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Trophy size={14} color={Colors.dark.accent} />
              <span className="text-xs font-medium" style={{ color: Colors.dark.textMuted }}>
                Games Played
              </span>
            </div>
            <div className="text-2xl font-extrabold" style={{ color: Colors.dark.text }}>
              {profile.totalPredictions}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        {recentBets.length > 0 && (
          <div
            className={cn(
              'transition-all duration-400',
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
            style={{ transitionDelay: '300ms' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <History size={14} color={Colors.dark.textMuted} />
              <span className="text-sm font-semibold" style={{ color: Colors.dark.textMuted }}>
                Recent Activity
              </span>
            </div>

            <div className="space-y-2">
              {recentBets.slice(0, 5).map((bet) => (
                <div
                  key={bet.id}
                  className="flex items-center gap-3 p-3 rounded-xl border"
                  style={{ backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                    style={{
                      backgroundColor: bet.isCorrect
                        ? Colors.dark.successDim
                        : bet.isCorrect === false
                        ? Colors.dark.errorDim
                        : Colors.dark.surfaceLight,
                    }}
                  >
                    {bet.isCorrect === true ? '✅' : bet.isCorrect === false ? '❌' : '⏳'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: Colors.dark.text }}>
                      {bet.questionPrompt}
                    </p>
                    <p className="text-xs" style={{ color: Colors.dark.textMuted }}>
                      Picked {bet.choice} · ${parseFloat(bet.betAmount).toFixed(0)}
                    </p>
                  </div>
                  {bet.payout && (
                    <span className="text-sm font-bold" style={{ color: Colors.dark.success }}>
                      +${parseFloat(bet.payout).toFixed(0)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
