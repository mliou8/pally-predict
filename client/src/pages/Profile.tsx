import { useState } from 'react';
import ProfileHeader from '@/components/ProfileHeader';
import HistoryCard from '@/components/HistoryCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export default function Profile() {
  const [activeTab, setActiveTab] = useState('public');

  //todo: remove mock functionality
  const mockPublicHistory = [
    {
      question: 'Will $SOL outperform $ETH by 12 PM tomorrow?',
      userChoice: 'Long SOL',
      outcome: 'correct' as const,
      pointsEarned: 120,
      timestamp: new Date().toISOString(),
      crowdSplitA: 37,
      crowdSplitB: 63,
    },
    {
      question: 'Will ETH reach $5k before end of month?',
      userChoice: 'No',
      outcome: 'correct' as const,
      pointsEarned: 85,
      timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
      crowdSplitA: 40,
      crowdSplitB: 60,
    },
  ];

  const mockPrivateHistory = [
    {
      question: 'Will BTC break $100k this week?',
      userChoice: 'Yes',
      outcome: 'incorrect' as const,
      pointsEarned: 0,
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      crowdSplitA: 65,
      crowdSplitB: 35,
    },
  ];

  const badges = [
    { name: '3 Correct in a Row', icon: '🔥', description: 'Win streak of 3+' },
    { name: 'High Accuracy', icon: '🧠', description: 'Public accuracy ≥75%' },
    { name: 'Contrarian Win', icon: '💎', description: 'Correct minority prediction' },
  ];

  return (
    <div className="min-h-screen pb-20 md:pb-6">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-6">
        <ProfileHeader
          handle="@CryptoOracle"
          rank="Silver"
          winRate={68}
          streak={4}
          totalPoints={1020}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="public" data-testid="tab-public">Public</TabsTrigger>
            <TabsTrigger value="private" data-testid="tab-private">Private</TabsTrigger>
            <TabsTrigger value="badges" data-testid="tab-badges">Badges</TabsTrigger>
          </TabsList>

          <TabsContent value="public" className="space-y-3 mt-6">
            {mockPublicHistory.map((entry, i) => (
              <HistoryCard key={i} {...entry} />
            ))}
          </TabsContent>

          <TabsContent value="private" className="space-y-3 mt-6">
            {mockPrivateHistory.map((entry, i) => (
              <HistoryCard key={i} {...entry} />
            ))}
          </TabsContent>

          <TabsContent value="badges" className="mt-6">
            <div className="grid gap-4">
              {badges.map((badge, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-border bg-card hover-elevate"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{badge.icon}</span>
                    <div>
                      <h3 className="font-semibold text-foreground">{badge.name}</h3>
                      <p className="text-sm text-muted-foreground">{badge.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
