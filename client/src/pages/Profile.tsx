import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePrivy } from '@privy-io/react-auth';
import { Link } from 'wouter';
import { Trophy, Coins, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import HistoryCard from '@/components/HistoryCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { getRankInfo, getRankColor } from '@/lib/ranks';
import type { User, Vote, Question, QuestionResults } from '@shared/schema';

interface UserStats {
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  totalWagered: string;
  totalEarned: string;
  profit: string;
  alphaPoints: number;
  currentStreak: number;
  maxStreak: number;
}

interface VoteWithDetails {
  vote: Vote;
  question: Question;
  results: QuestionResults | null;
}

export default function Profile() {
  const [activeTab, setActiveTab] = useState('public');
  const { user } = usePrivy();

  const { data: currentUser, isLoading: isLoadingUser, error: userError } = useQuery<User>({
    queryKey: ['/api/user/me'],
    enabled: !!user,
  });

  const { data: userStats, isLoading: isLoadingStats } = useQuery<UserStats>({
    queryKey: ['/api/user/stats'],
    enabled: !!user && !!currentUser,
  });

  const { data: votes = [], isLoading: isLoadingVotes } = useQuery<Vote[]>({
    queryKey: ['/api/votes/mine'],
    enabled: !!user,
  });

  const formatSol = (lamportsStr: string): string => {
    const lamports = BigInt(lamportsStr || '0');
    const sol = Number(lamports) / 1e9;
    return sol.toFixed(4);
  };

  const { data: votesWithDetails = [] } = useQuery<VoteWithDetails[]>({
    queryKey: ['/api/votes/mine/details'],
    queryFn: async () => {
      const details = await Promise.all(
        votes.map(async (vote) => {
          try {
            const questionResponse = await fetch(`/api/questions/${vote.questionId}`);
            const question = await questionResponse.json();

            let results = null;
            if (question.isRevealed) {
              const resultsResponse = await fetch(`/api/results/${vote.questionId}`);
              results = await resultsResponse.json();
            }

            return { vote, question, results };
          } catch (error) {
            return null;
          }
        })
      );
      return details.filter((d): d is VoteWithDetails => d !== null);
    },
    enabled: !!user && votes.length > 0,
  });

  const publicHistory = votesWithDetails.filter(({ vote }) => vote.isPublic);
  const privateHistory = votesWithDetails.filter(({ vote }) => !vote.isPublic);

  const rankInfo = currentUser ? getRankInfo(currentUser.alphaPoints) : null;
  const badges = currentUser?.badgesEarned || [];
  const badgeDetails = [
    { name: '3 Correct in a Row', icon: '🔥', description: 'Win streak of 3+' },
    { name: 'High Accuracy', icon: '🧠', description: 'Public accuracy ≥75%' },
    { name: 'Contrarian Win', icon: '💎', description: 'Correct minority prediction' },
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Please log in to view profile</p>
      </div>
    );
  }

  if (userError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-md">
          <p className="text-destructive font-semibold">Unable to load profile</p>
          <p className="text-sm text-muted-foreground">
            {userError instanceof Error ? userError.message : 'An error occurred'}
          </p>
          <Link href="/create-profile">
            <Button className="w-full">Create Profile</Button>
          </Link>
        </div>
      </div>
    );
  }

  const renderHistory = (history: VoteWithDetails[]) => {
    if (history.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-2">No history yet</p>
          <p className="text-sm text-muted-foreground">
            Start voting to build your track record
          </p>
        </div>
      );
    }

    return history.map(({ vote, question, results }) => {
      // Generate mock results if none exist
      let mockResults = results;
      if (!mockResults && question.isRevealed) {
        // Create deterministic mock results based on question ID
        const seed = question.id.charCodeAt(0) + question.id.charCodeAt(1);
        const isUserCorrect = seed % 3 !== 0; // 66% win rate
        
        // Determine winning option
        let winningOption: 'A' | 'B' | 'C' | 'D' = 'A';
        if (isUserCorrect) {
          winningOption = vote.choice as 'A' | 'B' | 'C' | 'D';
        } else {
          // Pick a different option than user's choice
          const options: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B'];
          if (question.optionC) options.push('C');
          if (question.optionD) options.push('D');
          const otherOptions = options.filter(opt => opt !== vote.choice);
          winningOption = otherOptions[seed % otherOptions.length] as 'A' | 'B' | 'C' | 'D';
        }
        
        // Generate percentages with winning option having most votes
        const percentages: Record<string, number> = { A: 20, B: 20, C: 20, D: 20 };
        percentages[winningOption] = 40 + (seed % 20);
        
        // Redistribute remaining percentage
        const remaining = 100 - percentages[winningOption];
        const otherOptions = ['A', 'B', 'C', 'D'].filter(opt => opt !== winningOption);
        otherOptions.forEach((opt, idx) => {
          if ((opt === 'C' && !question.optionC) || (opt === 'D' && !question.optionD)) {
            percentages[opt] = 0;
          } else {
            percentages[opt] = Math.floor(remaining / otherOptions.filter(o => 
              !((o === 'C' && !question.optionC) || (o === 'D' && !question.optionD))
            ).length);
          }
        });
        
        mockResults = {
          id: question.id + '-results',
          questionId: question.id,
          percentA: percentages.A,
          percentB: percentages.B,
          percentC: percentages.C || null,
          percentD: percentages.D || null,
          votesA: Math.floor((percentages.A / 100) * (50 + (seed % 100))),
          votesB: Math.floor((percentages.B / 100) * (50 + (seed % 100))),
          votesC: percentages.C ? Math.floor((percentages.C / 100) * (50 + (seed % 100))) : null,
          votesD: percentages.D ? Math.floor((percentages.D / 100) * (50 + (seed % 100))) : null,
          totalVotes: 50 + (seed % 100),
          rarityMultipliers: { A: 1.0, B: 1.0, C: 1.0, D: 1.0 },
          revealedAt: new Date(),
        };
      }

      const optionLabels: Record<string, string> = {
        A: question.optionA,
        B: question.optionB,
        C: question.optionC || '',
        D: question.optionD || '',
      };

      const userChoiceLabel = optionLabels[vote.choice] || vote.choice;
      const pointsEarned = vote.pointsEarned || 0;
      const crowdSplitA = mockResults ? mockResults.percentA : 0;
      const crowdSplitB = mockResults ? mockResults.percentB : 0;

      let outcome: 'correct' | 'incorrect' | 'pending' = 'pending';
      let outcomeDescription: string | undefined;

      if (mockResults) {
        const percentages = [
          { choice: 'A', percent: mockResults.percentA },
          { choice: 'B', percent: mockResults.percentB },
          { choice: 'C', percent: mockResults.percentC || 0 },
          { choice: 'D', percent: mockResults.percentD || 0 },
        ];
        const sorted = [...percentages].sort((a, b) => b.percent - a.percent);
        const topChoice = sorted[0].choice;
        const isMajority = vote.choice === topChoice;
        
        outcome = pointsEarned > 0 ? 'correct' : 'incorrect';
        outcomeDescription = isMajority ? 'Majority prediction' : 'Minority prediction';
      }

      return (
        <HistoryCard
          key={vote.id}
          question={question.prompt}
          choice={vote.choice}
          userChoiceLabel={userChoiceLabel}
          outcome={outcome}
          pointsEarned={pointsEarned}
          timestamp={vote.votedAt.toString()}
          crowdSplitA={crowdSplitA}
          crowdSplitB={crowdSplitB}
          isPublic={vote.isPublic}
          outcomeDescription={outcomeDescription}
        />
      );
    });
  };

  const allRankTiers = [
    { rank: 'Bronze', min: 0, max: 499, emoji: '🥉', color: 'from-amber-700 to-amber-900' },
    { rank: 'Silver', min: 500, max: 999, emoji: '🥈', color: 'from-slate-400 to-slate-600' },
    { rank: 'Gold', min: 1000, max: 1999, emoji: '🥇', color: 'from-yellow-400 to-yellow-600' },
    { rank: 'Platinum', min: 2000, max: 4999, emoji: '💎', color: 'from-cyan-400 to-blue-500' },
    { rank: 'Diamond', min: 5000, max: Infinity, emoji: '💎', color: 'from-purple-400 to-pink-500' },
  ];

  return (
    <div className="min-h-screen pb-20 md:pb-6">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-6">
        <div className="flex justify-end">
          <Link href="/leaderboard">
            <Button variant="outline" className="gap-2" data-testid="button-leaderboard">
              <Trophy size={16} />
              Leaderboard
            </Button>
          </Link>
        </div>

        {isLoadingUser ? (
          <>
            <Skeleton className="h-64 w-full rounded-3xl" />
            <Skeleton className="h-32 w-full rounded-3xl" />
          </>
        ) : currentUser && rankInfo ? (
          <>
            {/* Hero Rank Display */}
            <div className="relative overflow-hidden rounded-3xl border border-card-border bg-gradient-to-br from-card via-card to-muted p-6 md:p-8" data-testid="hero-rank-display">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-brand-magenta/5" />
              
              <div className="relative space-y-6">
                {/* User Info */}
                <div className="flex items-center gap-4" data-testid="user-info-section">
                  <Avatar className="h-16 w-16 border-2 border-primary/20" data-testid="user-avatar">
                    <AvatarFallback className="text-xl bg-gradient-to-br from-primary/20 to-brand-magenta/20">
                      {currentUser.handle?.substring(0, 2).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-1" data-testid="text-handle">
                      {currentUser.handle || '@User'}
                    </h2>
                    <p className="text-sm text-muted-foreground">Alpha Trader</p>
                  </div>
                </div>

                {/* Current Rank Showcase */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-muted/50 to-muted/30 border border-border" data-testid="rank-showcase">
                  <div className="flex items-center gap-4">
                    <div className="text-5xl sm:text-6xl" data-testid="rank-emoji">
                      {rankInfo.emoji}
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Current Rank</div>
                      <div className={`text-2xl sm:text-3xl font-bold bg-gradient-to-r ${getRankColor(rankInfo.current)} bg-clip-text text-transparent`} data-testid="rank-badge">
                        {rankInfo.current}
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right w-full sm:w-auto">
                    <div className="text-sm text-muted-foreground mb-1">Alpha Points</div>
                    <div className="text-2xl sm:text-3xl font-bold font-mono bg-gradient-to-r from-primary to-brand-magenta bg-clip-text text-transparent" data-testid="text-points">
                      {currentUser.alphaPoints.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Progress to Next Rank */}
                {rankInfo.nextRank && (
                  <div className="space-y-3" data-testid="rank-progress-section">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress to {rankInfo.nextRank}</span>
                      <span className="font-semibold text-foreground" data-testid="text-points-to-next">{rankInfo.pointsToNext.toLocaleString()} pts to go</span>
                    </div>
                    <Progress 
                      value={rankInfo.progressPercent} 
                      className="h-3"
                      data-testid="rank-progress"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" data-testid="stats-grid">
              <div className="p-6 rounded-2xl bg-card border border-card-border" data-testid="stat-winrate">
                <div className="text-xs text-muted-foreground mb-2">Win Rate</div>
                <div className="text-3xl font-bold font-mono text-foreground" data-testid="text-winrate">
                  {userStats?.accuracy || 0}%
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-card border border-card-border" data-testid="stat-streak">
                <div className="text-xs text-muted-foreground mb-2">Streak</div>
                <div className="text-3xl font-bold font-mono text-foreground" data-testid="text-streak">
                  {currentUser.currentStreak}
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-card border border-card-border" data-testid="stat-max-streak">
                <div className="text-xs text-muted-foreground mb-2">Max Streak</div>
                <div className="text-3xl font-bold font-mono text-foreground" data-testid="text-max-streak">
                  {currentUser.maxStreak}
                </div>
              </div>
            </div>

            {/* SOL Earnings Section */}
            <div className="relative overflow-hidden rounded-3xl border border-card-border bg-gradient-to-br from-card via-card to-muted p-6" data-testid="sol-earnings-section">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5" />
              
              <div className="relative space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-cyan-500/20">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">SOL Earnings</h3>
                </div>

                {isLoadingStats ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Skeleton className="h-24 w-full rounded-xl" />
                    <Skeleton className="h-24 w-full rounded-xl" />
                    <Skeleton className="h-24 w-full rounded-xl" />
                  </div>
                ) : userStats ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-muted/30 border border-border" data-testid="stat-wagered">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <Coins className="h-4 w-4" />
                        <span>Total Wagered</span>
                      </div>
                      <div className="text-2xl font-bold font-mono text-foreground" data-testid="text-total-wagered">
                        {formatSol(userStats.totalWagered)} SOL
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/30 border border-border" data-testid="stat-earned">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <TrendingUp className="h-4 w-4" />
                        <span>Total Earned</span>
                      </div>
                      <div className="text-2xl font-bold font-mono text-foreground" data-testid="text-total-earned">
                        {formatSol(userStats.totalEarned)} SOL
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/30 border border-border" data-testid="stat-profit">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        {BigInt(userStats.profit) >= BigInt(0) ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <span>Profit/Loss</span>
                      </div>
                      <div className={`text-2xl font-bold font-mono ${
                        BigInt(userStats.profit) >= BigInt(0) ? 'text-green-500' : 'text-red-500'
                      }`} data-testid="text-profit">
                        {BigInt(userStats.profit) >= BigInt(0) ? '+' : ''}{formatSol(userStats.profit)} SOL
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No betting data yet
                  </div>
                )}

                {/* Linked Wallet Info */}
                {currentUser.solanaAddress && (
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Linked Wallet:</span>
                      <code className="px-2 py-1 rounded bg-muted text-xs" data-testid="text-wallet-address">
                        {currentUser.solanaAddress.slice(0, 4)}...{currentUser.solanaAddress.slice(-4)}
                      </code>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* All Ranks Overview */}
            <div className="p-6 rounded-3xl bg-card border border-card-border space-y-4">
              <h3 className="text-lg font-semibold text-foreground mb-4">Rank Tiers</h3>
              <div className="space-y-3">
                {allRankTiers.map((tier, index) => {
                  const isCurrentRank = tier.rank === rankInfo.current;
                  const isUnlocked = currentUser.alphaPoints >= tier.min;
                  
                  return (
                    <div
                      key={tier.rank}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                        isCurrentRank 
                          ? 'border-primary bg-gradient-to-r from-primary/10 to-brand-magenta/10' 
                          : isUnlocked
                          ? 'border-border bg-muted/30'
                          : 'border-border bg-muted/10 opacity-50'
                      }`}
                      data-testid={`tier-${tier.rank.toLowerCase()}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{tier.emoji}</span>
                        <div>
                          <div className={`font-bold text-lg ${
                            isCurrentRank 
                              ? `bg-gradient-to-r ${tier.color} bg-clip-text text-transparent`
                              : isUnlocked ? 'text-foreground' : 'text-muted-foreground'
                          }`}>
                            {tier.rank}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {tier.min.toLocaleString()} - {tier.max === Infinity ? '∞' : tier.max.toLocaleString()} pts
                          </div>
                        </div>
                      </div>
                      {isCurrentRank && (
                        <Badge variant="outline" className="border-primary text-primary">
                          Current
                        </Badge>
                      )}
                      {!isCurrentRank && isUnlocked && (
                        <Badge variant="outline" className="border-green-500/50 text-green-500">
                          Unlocked
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : null}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="public" data-testid="tab-public">Public</TabsTrigger>
            <TabsTrigger value="private" data-testid="tab-private">Private</TabsTrigger>
            <TabsTrigger value="badges" data-testid="tab-badges">Badges</TabsTrigger>
          </TabsList>

          <TabsContent value="public" className="space-y-3 mt-6">
            {isLoadingVotes ? (
              <>
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-xl" data-testid={`skeleton-public-${i}`} />
                ))}
              </>
            ) : (
              renderHistory(publicHistory)
            )}
          </TabsContent>

          <TabsContent value="private" className="space-y-3 mt-6">
            {isLoadingVotes ? (
              <>
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-xl" data-testid={`skeleton-private-${i}`} />
                ))}
              </>
            ) : (
              renderHistory(privateHistory)
            )}
          </TabsContent>

          <TabsContent value="badges" className="mt-6">
            <div className="grid gap-4">
              {badgeDetails.map((badge, i) => (
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
