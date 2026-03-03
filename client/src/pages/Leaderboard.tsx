import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePrivy } from '@privy-io/react-auth';
import { Trophy, Crown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Colors from '@/constants/colors';
import { cn } from '@/lib/utils';
import type { User } from '@shared/schema';

interface LeaderboardEntry extends User {
  accuracy: number;
}

type TimePeriod = 'weekly' | 'monthly' | 'allTime';

export default function Leaderboard() {
  const [period, setPeriod] = useState<TimePeriod>('weekly');
  const { user } = usePrivy();

  // Fetch leaderboard data
  const { data: leaderboard = [], isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/leaderboard', period],
    enabled: !!user,
  });

  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/user/me'],
    enabled: !!user,
  });

  const currentUserRank = currentUser
    ? leaderboard.findIndex(u => u.id === currentUser.id) + 1
    : 0;

  if (!user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: Colors.dark.background }}
      >
        <p style={{ color: Colors.dark.textMuted }}>Please log in to view leaderboard</p>
      </div>
    );
  }

  // Top 3 for podium
  const top3 = leaderboard.slice(0, 3);
  const restOfList = leaderboard.slice(3);

  // Reorder for podium display: [2nd, 1st, 3rd]
  const podiumOrder = top3.length >= 3
    ? [top3[1], top3[0], top3[2]]
    : top3;

  const podiumHeights = ['h-24', 'h-32', 'h-20']; // 2nd, 1st, 3rd
  const podiumColors = ['#C0C0C0', '#FFD700', '#CD7F32']; // Silver, Gold, Bronze
  const podiumLabels = ['2ND', '1ST', '3RD'];
  const podiumRanks = [2, 1, 3];

  return (
    <div className="min-h-screen pb-20 md:pb-6" style={{ backgroundColor: Colors.dark.background }}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1
            className="text-2xl font-bold mb-1"
            style={{ color: Colors.dark.text }}
          >
            Leaderboard
          </h1>
          <p
            className="text-sm"
            style={{ color: Colors.dark.textMuted }}
          >
            Ranked by <span style={{ color: Colors.dark.accent }}>Wager Points (WP)</span>
          </p>
        </div>

        {/* Period Tabs */}
        <div
          className="flex rounded-xl p-1 mb-6"
          style={{ backgroundColor: Colors.dark.surface }}
        >
          {[
            { id: 'weekly' as TimePeriod, label: 'Weekly' },
            { id: 'monthly' as TimePeriod, label: 'Monthly' },
            { id: 'allTime' as TimePeriod, label: 'All Time' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id)}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all'
              )}
              style={{
                backgroundColor: period === tab.id ? Colors.dark.card : 'transparent',
                color: period === tab.id ? Colors.dark.accent : Colors.dark.textMuted,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-xl" />
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-16">
            <Trophy size={48} className="mx-auto mb-4 opacity-30" style={{ color: Colors.dark.textMuted }} />
            <p style={{ color: Colors.dark.textMuted }}>No leaderboard data yet</p>
            <p className="text-sm mt-2" style={{ color: Colors.dark.textMuted }}>
              Start playing to see rankings!
            </p>
          </div>
        ) : (
          <>
            {/* Podium Section */}
            {top3.length >= 3 && (
              <div
                className="rounded-2xl p-6 mb-6 overflow-hidden"
                style={{
                  backgroundColor: Colors.dark.card,
                  background: `linear-gradient(180deg, ${Colors.dark.card} 0%, ${Colors.dark.surface} 100%)`,
                }}
              >
                <div className="flex items-end justify-center gap-2">
                  {podiumOrder.map((entry, index) => {
                    if (!entry) return null;
                    const actualRank = podiumRanks[index];
                    const points = parseFloat(entry.balance) || 0;

                    return (
                      <div
                        key={entry.id}
                        className="flex flex-col items-center"
                        style={{ width: index === 1 ? '120px' : '100px' }}
                      >
                        {/* Avatar */}
                        <div className="relative mb-2">
                          <Avatar
                            className={cn(
                              'border-2',
                              index === 1 ? 'h-16 w-16' : 'h-12 w-12'
                            )}
                            style={{ borderColor: podiumColors[index] }}
                          >
                            <AvatarFallback
                              className="text-sm font-bold"
                              style={{
                                backgroundColor: Colors.dark.surface,
                                color: Colors.dark.text,
                              }}
                            >
                              {entry.handle?.substring(0, 2).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          {index === 1 && (
                            <Crown
                              size={20}
                              className="absolute -top-3 left-1/2 -translate-x-1/2"
                              style={{ color: '#FFD700' }}
                              fill="#FFD700"
                            />
                          )}
                        </div>

                        {/* Name */}
                        <p
                          className={cn(
                            'font-semibold text-center truncate w-full',
                            index === 1 ? 'text-sm' : 'text-xs'
                          )}
                          style={{ color: Colors.dark.text }}
                        >
                          {entry.handle || 'Anonymous'}
                        </p>

                        {/* Points */}
                        <p
                          className={cn(
                            'font-bold',
                            index === 1 ? 'text-base' : 'text-sm'
                          )}
                          style={{ color: Colors.dark.accent }}
                        >
                          {Math.round(points).toLocaleString()} WP
                        </p>

                        {/* Podium Block */}
                        <div
                          className={cn(
                            'w-full rounded-t-lg flex items-start justify-center pt-2 mt-2',
                            podiumHeights[index]
                          )}
                          style={{
                            backgroundColor: Colors.dark.surface,
                            borderTop: `3px solid ${podiumColors[index]}`,
                          }}
                        >
                          <div
                            className="flex items-center gap-1.5 px-3 py-1 rounded-md"
                            style={{ backgroundColor: Colors.dark.card }}
                          >
                            <Trophy size={12} style={{ color: podiumColors[index] }} />
                            <span
                              className="text-xs font-bold"
                              style={{ color: Colors.dark.text }}
                            >
                              {podiumLabels[index]}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* List Header */}
            <div
              className="flex items-center px-4 py-3 text-xs font-medium uppercase tracking-wider"
              style={{ color: Colors.dark.textMuted }}
            >
              <span className="w-12">Rank</span>
              <span className="flex-1">User</span>
              <span className="w-20 text-right" style={{ color: Colors.dark.accent }}>WP</span>
            </div>

            {/* Leaderboard List */}
            <div className="space-y-2">
              {(top3.length < 3 ? leaderboard : restOfList).map((entry, index) => {
                const rank = top3.length < 3 ? index + 1 : index + 4;
                const isCurrentUser = currentUser?.id === entry.id;
                const points = parseFloat(entry.balance) || 0;

                return (
                  <div
                    key={entry.id}
                    className={cn(
                      'flex items-center px-4 py-4 rounded-xl transition-all',
                      isCurrentUser && 'ring-2'
                    )}
                    style={{
                      backgroundColor: Colors.dark.card,
                      ...(isCurrentUser && { ringColor: Colors.dark.accent }),
                    }}
                  >
                    {/* Rank */}
                    <div
                      className="w-12 text-sm font-medium"
                      style={{ color: Colors.dark.textMuted }}
                    >
                      #{rank}
                    </div>

                    {/* Avatar + Name */}
                    <div className="flex-1 flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback
                          className="text-sm font-bold"
                          style={{
                            backgroundColor: Colors.dark.surface,
                            color: Colors.dark.text,
                          }}
                        >
                          {entry.handle?.substring(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p
                          className="font-semibold"
                          style={{ color: Colors.dark.text }}
                        >
                          {entry.handle || 'Anonymous'}
                          {isCurrentUser && (
                            <span
                              className="ml-2 text-xs"
                              style={{ color: Colors.dark.accent }}
                            >
                              (You)
                            </span>
                          )}
                        </p>
                        {entry.currentStreak > 0 && (
                          <p
                            className="text-xs"
                            style={{ color: Colors.dark.textMuted }}
                          >
                            🔥 {entry.currentStreak} day streak
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Points */}
                    <div className="w-20 text-right">
                      <p
                        className="font-bold"
                        style={{ color: Colors.dark.accent }}
                      >
                        {Math.round(points).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Current User Position (if not in visible list) */}
            {currentUser && currentUserRank > 10 && (
              <div
                className="mt-6 p-4 rounded-xl border-2 border-dashed"
                style={{
                  borderColor: Colors.dark.accent,
                  backgroundColor: Colors.dark.card,
                }}
              >
                <div className="flex items-center">
                  <div
                    className="w-12 text-sm font-medium"
                    style={{ color: Colors.dark.textMuted }}
                  >
                    #{currentUserRank}
                  </div>
                  <div className="flex-1 flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback
                        className="text-sm font-bold"
                        style={{
                          backgroundColor: Colors.dark.surface,
                          color: Colors.dark.text,
                        }}
                      >
                        {currentUser.handle?.substring(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <p
                      className="font-semibold"
                      style={{ color: Colors.dark.text }}
                    >
                      {currentUser.handle}
                      <span
                        className="ml-2 text-xs"
                        style={{ color: Colors.dark.accent }}
                      >
                        (You)
                      </span>
                    </p>
                  </div>
                  <div className="w-20 text-right">
                    <p
                      className="font-bold"
                      style={{ color: Colors.dark.accent }}
                    >
                      {Math.round(parseFloat(currentUser.balance) || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
