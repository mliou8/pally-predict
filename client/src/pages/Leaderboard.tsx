import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePrivy } from '@privy-io/react-auth';
import LeaderboardRow from '@/components/LeaderboardRow';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Trophy, Coins } from 'lucide-react';
import type { User } from '@shared/schema';

interface LeaderboardEntry extends User {
  accuracy: number;
}

// Season start epoch: Monday, January 1, 2024 at 12:00 PM ET
// This is our reference point for 7-day cycles
const SEASON_START_EPOCH = new Date('2024-01-01T12:00:00-05:00').getTime();
const SEASON_LENGTH_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

function getSeasonEndTime(): Date {
  const now = Date.now();

  // Calculate how many complete seasons have passed since epoch
  const timeSinceEpoch = now - SEASON_START_EPOCH;
  const seasonsPassed = Math.floor(timeSinceEpoch / SEASON_LENGTH_MS);

  // Calculate when the current season ends (start of next season)
  const currentSeasonEnd = SEASON_START_EPOCH + ((seasonsPassed + 1) * SEASON_LENGTH_MS);

  return new Date(currentSeasonEnd);
}

function useSeasonCountdown() {
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const seasonEnd = getSeasonEndTime();
      const diff = seasonEnd.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Season ended');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeRemaining(`${days} day${days > 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''}`);
      } else {
        setTimeRemaining(`${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);

    return () => clearInterval(interval);
  }, []);

  return timeRemaining;
}

export default function Leaderboard() {
  const [mainTab, setMainTab] = useState('points');
  const { user } = usePrivy();
  const seasonCountdown = useSeasonCountdown();

  // Points leaderboard (sorted by alpha points)
  const { data: pointsLeaderboard = [], isLoading: isLoadingPoints } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/leaderboard'],
    enabled: !!user,
  });

  // Earnings leaderboard (sorted by total won)
  const { data: earningsLeaderboard = [], isLoading: isLoadingEarnings } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/leaderboard/earnings'],
    enabled: !!user,
  });

  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/user/me'],
    enabled: !!user,
  });

  const currentUserPointsRank = currentUser
    ? pointsLeaderboard.findIndex(u => u.id === currentUser.id) + 1
    : 0;

  const currentUserEarningsRank = currentUser
    ? earningsLeaderboard.findIndex(u => u.id === currentUser.id) + 1
    : 0;

  const currentUserPointsEntry = currentUser
    ? pointsLeaderboard.find(u => u.id === currentUser.id)
    : null;

  const currentUserEarningsEntry = currentUser
    ? earningsLeaderboard.find(u => u.id === currentUser.id)
    : null;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Please log in to view leaderboard</p>
      </div>
    );
  }

  const renderLeaderboardList = (
    data: LeaderboardEntry[],
    isLoading: boolean,
    showEarnings: boolean = false
  ) => {
    if (isLoading) {
      return (
        <>
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </>
      );
    }

    if (data.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-2">No leaderboard data yet</p>
          <p className="text-sm text-muted-foreground">
            Start voting to see rankings!
          </p>
        </div>
      );
    }

    return data.map((entry, index) => (
      <LeaderboardRow
        key={entry.id}
        rank={index + 1}
        handle={entry.handle || `@User${entry.id.slice(0, 4)}`}
        accuracyPct={entry.accuracy}
        points={entry.alphaPoints}
        earnings={showEarnings ? entry.totalWon : undefined}
        badges={entry.badgesEarned}
      />
    ));
  };

  return (
    <div className="min-h-screen pb-20 md:pb-6">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10">
        <h1 className="text-2xl font-display font-bold mb-6 bg-gradient-to-r from-primary to-brand-magenta bg-clip-text text-transparent">
          Leaderboard
        </h1>

        <div className="mb-6 p-4 rounded-2xl border border-border bg-card/50 backdrop-blur">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground" data-testid="season-timer">
              Season ends in: {seasonCountdown || 'Calculating...'}
            </span>
          </div>
        </div>

        {/* Main tabs: Points vs Earnings */}
        <Tabs value={mainTab} onValueChange={setMainTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="points" className="flex items-center gap-2" data-testid="tab-points">
              <Trophy size={16} />
              Points
            </TabsTrigger>
            <TabsTrigger value="earnings" className="flex items-center gap-2" data-testid="tab-earnings">
              <Coins size={16} />
              Earnings
            </TabsTrigger>
          </TabsList>

          {/* Points Leaderboard */}
          <TabsContent value="points" className="space-y-2 mt-6">
            <div className="mb-4 p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground text-center">
                Ranked by Wager Points earned from predictions. Points unlock future rewards.
              </p>
            </div>
            {renderLeaderboardList(pointsLeaderboard, isLoadingPoints, false)}
          </TabsContent>

          {/* Earnings Leaderboard */}
          <TabsContent value="earnings" className="space-y-2 mt-6">
            <div className="mb-4 p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground text-center">
                Ranked by total winnings. Top earners get the biggest payouts.
              </p>
            </div>
            {renderLeaderboardList(earningsLeaderboard, isLoadingEarnings, true)}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
