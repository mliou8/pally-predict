import { useState } from 'react';
import LeaderboardRow from '@/components/LeaderboardRow';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState('week');

  //todo: remove mock functionality
  const mockLeaderboard = [
    { rank: 1, handle: '@DegenOracle', accuracyPct: 87, points: 4230, badges: ['🔥', '🧠'] },
    { rank: 2, handle: '@CryptoTuna', accuracyPct: 84, points: 3970, badges: ['🧠'] },
    { rank: 3, handle: '@AlphaHunter', accuracyPct: 82, points: 3540, badges: ['🔥'] },
    { rank: 4, handle: '@MoonBoi', accuracyPct: 79, points: 3210, badges: [] },
    { rank: 5, handle: '@DiamondHands', accuracyPct: 77, points: 2890, badges: ['🕵️'] },
    { rank: 6, handle: '@WhaleWatcher', accuracyPct: 75, points: 2560, badges: [] },
    { rank: 7, handle: '@BullMarket', accuracyPct: 73, points: 2340, badges: [] },
    { rank: 8, handle: '@ChartMaster', accuracyPct: 71, points: 2120, badges: [] },
  ];

  return (
    <div className="min-h-screen pb-20 md:pb-6">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">
        <h1 className="text-2xl font-display font-bold mb-6 bg-gradient-to-r from-primary to-brand-magenta bg-clip-text text-transparent">
          Leaderboard
        </h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="week" data-testid="tab-week">This Week</TabsTrigger>
            <TabsTrigger value="alltime" data-testid="tab-alltime">All-Time</TabsTrigger>
            <TabsTrigger value="guilds" data-testid="tab-guilds">Guilds</TabsTrigger>
          </TabsList>

          <TabsContent value="week" className="space-y-2 mt-6">
            {mockLeaderboard.map((entry) => (
              <LeaderboardRow key={entry.rank} {...entry} />
            ))}
          </TabsContent>

          <TabsContent value="alltime" className="space-y-2 mt-6">
            {mockLeaderboard.map((entry) => (
              <LeaderboardRow key={entry.rank} {...entry} />
            ))}
          </TabsContent>

          <TabsContent value="guilds" className="mt-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-2">Guilds coming soon</p>
              <p className="text-sm text-muted-foreground">
                Team up and compete together
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="sticky bottom-20 md:bottom-6 mt-6 p-4 rounded-xl bg-primary/10 border border-primary/50">
          <LeaderboardRow
            rank={42}
            handle="@You"
            accuracyPct={68}
            points={1020}
            isCurrentUser
          />
        </div>
      </div>
    </div>
  );
}
