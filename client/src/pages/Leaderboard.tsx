import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePrivy } from '@privy-io/react-auth';
import LeaderboardRow from '@/components/LeaderboardRow';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import type { User } from '@shared/schema';

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
  const [activeTab, setActiveTab] = useState('daily');
  const { user } = usePrivy();
  const seasonCountdown = useSeasonCountdown();

  const { data: leaderboardData = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/leaderboard'],
    enabled: !!user,
  });

  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/user/me'],
    enabled: !!user,
  });

  const currentUserRank = currentUser 
    ? leaderboardData.findIndex(u => u.id === currentUser.id) + 1
    : 0;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Please log in to view leaderboard</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-6">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="daily" data-testid="tab-daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly" data-testid="tab-weekly">Weekly</TabsTrigger>
            <TabsTrigger value="alltime" data-testid="tab-alltime">All-time</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-2 mt-6">
            {isLoading ? (
              <>
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </>
            ) : leaderboardData.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-2">No leaderboard data yet</p>
                <p className="text-sm text-muted-foreground">
                  Start voting to see rankings!
                </p>
              </div>
            ) : (
              leaderboardData.map((entry, index) => (
                <LeaderboardRow 
                  key={entry.id} 
                  rank={index + 1}
                  handle={entry.handle || `@User${entry.id.slice(0, 4)}`}
                  accuracyPct={0}
                  points={entry.alphaPoints}
                  badges={entry.badgesEarned}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="weekly" className="space-y-2 mt-6">
            {isLoading ? (
              <>
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </>
            ) : leaderboardData.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-2">No leaderboard data yet</p>
                <p className="text-sm text-muted-foreground">
                  Start voting to see rankings!
                </p>
              </div>
            ) : (
              leaderboardData.map((entry, index) => (
                <LeaderboardRow 
                  key={entry.id} 
                  rank={index + 1}
                  handle={entry.handle || `@User${entry.id.slice(0, 4)}`}
                  accuracyPct={0}
                  points={entry.alphaPoints}
                  badges={entry.badgesEarned}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="alltime" className="space-y-2 mt-6">
            {isLoading ? (
              <>
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </>
            ) : leaderboardData.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-2">No leaderboard data yet</p>
                <p className="text-sm text-muted-foreground">
                  Start voting to see rankings!
                </p>
              </div>
            ) : (
              leaderboardData.map((entry, index) => (
                <LeaderboardRow 
                  key={entry.id} 
                  rank={index + 1}
                  handle={entry.handle || `@User${entry.id.slice(0, 4)}`}
                  accuracyPct={0}
                  points={entry.alphaPoints}
                  badges={entry.badgesEarned}
                />
              ))
            )}
          </TabsContent>
        </Tabs>

        {currentUser && currentUserRank > 0 && (
          <div className="sticky bottom-20 md:bottom-6 mt-6 p-4 rounded-xl bg-primary/10 border border-primary/50">
            <LeaderboardRow
              rank={currentUserRank}
              handle={currentUser.handle || '@You'}
              accuracyPct={0}
              points={currentUser.alphaPoints}
              isCurrentUser
            />
          </div>
        )}
      </div>
    </div>
  );
}
