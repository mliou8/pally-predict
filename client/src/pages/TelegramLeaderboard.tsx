import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Crown, Flame, TrendingUp } from 'lucide-react';
import Colors from '@/constants/colors';
import { cn } from '@/lib/utils';
import { useTelegram } from '@/contexts/TelegramContext';

interface LeaderboardEntry {
  id: string;
  telegramUsername: string | null;
  firstName: string | null;
  handle: string | null;
  balance: string;
  currentStreak: number;
  totalPredictions: number;
  correctPredictions: number;
}

export default function TelegramLeaderboard() {
  const { initData, user: telegramUser } = useTelegram();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const { data: leaders = [], isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/telegram/leaderboard'],
    queryFn: async () => {
      const response = await fetch('/api/telegram/leaderboard', {
        headers: { 'X-Telegram-Init-Data': initData },
      });
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      return response.json();
    },
    enabled: !!initData,
  });

  const getMedal = (rank: number) => {
    switch (rank) {
      case 1: return { emoji: '🥇', color: '#FFD700' };
      case 2: return { emoji: '🥈', color: '#C0C0C0' };
      case 3: return { emoji: '🥉', color: '#CD7F32' };
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: Colors.dark.background }}>
        <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: Colors.dark.accent, borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: Colors.dark.background }}>
      <div className="max-w-lg mx-auto px-5 py-6">
        {/* Header */}
        <div
          className={cn(
            'flex items-center gap-3 mb-6 transition-all duration-400',
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: Colors.dark.warningDim }}
          >
            <Trophy size={24} color={Colors.dark.warning} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold" style={{ color: Colors.dark.text }}>
              Leaderboard
            </h1>
            <p className="text-sm" style={{ color: Colors.dark.textMuted }}>
              Top predictors this week
            </p>
          </div>
        </div>

        {/* Top 3 Podium */}
        {leaders.length >= 3 && (
          <div
            className={cn(
              'flex justify-center items-end gap-2 mb-8 transition-all duration-500',
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            )}
            style={{ transitionDelay: '150ms' }}
          >
            {/* 2nd Place */}
            <div className="flex flex-col items-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-2 border"
                style={{ backgroundColor: Colors.dark.surface, borderColor: '#C0C0C0' }}
              >
                <span className="text-2xl">🥈</span>
              </div>
              <div
                className="w-20 h-16 rounded-t-xl flex flex-col items-center justify-center"
                style={{ backgroundColor: Colors.dark.surfaceLight }}
              >
                <span className="text-xs font-bold truncate max-w-[72px]" style={{ color: Colors.dark.text }}>
                  {leaders[1].telegramUsername || leaders[1].firstName || 'Player'}
                </span>
                <span className="text-sm font-extrabold" style={{ color: '#C0C0C0' }}>
                  ${parseFloat(leaders[1].balance).toFixed(0)}
                </span>
              </div>
            </div>

            {/* 1st Place */}
            <div className="flex flex-col items-center -mt-4">
              <Crown size={20} color="#FFD700" className="mb-1" />
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mb-2 border-2"
                style={{ backgroundColor: Colors.dark.surface, borderColor: '#FFD700' }}
              >
                <span className="text-3xl">🥇</span>
              </div>
              <div
                className="w-24 h-20 rounded-t-xl flex flex-col items-center justify-center"
                style={{ backgroundColor: Colors.dark.warningDim }}
              >
                <span className="text-sm font-bold truncate max-w-[88px]" style={{ color: Colors.dark.text }}>
                  {leaders[0].telegramUsername || leaders[0].firstName || 'Player'}
                </span>
                <span className="text-lg font-extrabold" style={{ color: '#FFD700' }}>
                  ${parseFloat(leaders[0].balance).toFixed(0)}
                </span>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-2 border"
                style={{ backgroundColor: Colors.dark.surface, borderColor: '#CD7F32' }}
              >
                <span className="text-2xl">🥉</span>
              </div>
              <div
                className="w-20 h-14 rounded-t-xl flex flex-col items-center justify-center"
                style={{ backgroundColor: Colors.dark.surfaceLight }}
              >
                <span className="text-xs font-bold truncate max-w-[72px]" style={{ color: Colors.dark.text }}>
                  {leaders[2].telegramUsername || leaders[2].firstName || 'Player'}
                </span>
                <span className="text-sm font-extrabold" style={{ color: '#CD7F32' }}>
                  ${parseFloat(leaders[2].balance).toFixed(0)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Rest of leaderboard */}
        <div className="space-y-2">
          {leaders.slice(3).map((entry, index) => {
            const rank = index + 4;
            const isCurrentUser = entry.id === telegramUser?.id?.toString();
            const accuracy = entry.totalPredictions > 0
              ? Math.round((entry.correctPredictions / entry.totalPredictions) * 100)
              : 0;

            return (
              <div
                key={entry.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border transition-all duration-300',
                  isCurrentUser && 'border-[1.5px]'
                )}
                style={{
                  backgroundColor: isCurrentUser ? Colors.dark.accentDim : Colors.dark.surface,
                  borderColor: isCurrentUser ? Colors.dark.accent : Colors.dark.border,
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(12px)',
                  transitionDelay: `${(index + 4) * 50}ms`,
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: Colors.dark.surfaceLight }}
                >
                  <span className="text-sm font-bold" style={{ color: Colors.dark.textMuted }}>
                    {rank}
                  </span>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: Colors.dark.text }}>
                      {entry.telegramUsername ? `@${entry.telegramUsername}` : entry.firstName || 'Player'}
                    </span>
                    {isCurrentUser && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: Colors.dark.accent, color: '#fff' }}>
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs" style={{ color: Colors.dark.textMuted }}>
                      {accuracy}% accuracy
                    </span>
                    {entry.currentStreak > 0 && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: Colors.dark.warning }}>
                        <Flame size={10} />
                        {entry.currentStreak}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-base font-extrabold tabular-nums" style={{ color: Colors.dark.text }}>
                    ${parseFloat(entry.balance).toFixed(0)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {leaders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <Trophy size={48} color={Colors.dark.textMuted} className="mb-4 opacity-50" />
            <p className="text-lg font-semibold" style={{ color: Colors.dark.text }}>
              No players yet
            </p>
            <p className="text-sm" style={{ color: Colors.dark.textMuted }}>
              Be the first to make a prediction!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
