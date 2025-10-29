import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePrivy } from '@privy-io/react-auth';
import { Link } from 'wouter';
import { Trophy } from 'lucide-react';
import ProfileHeader from '@/components/ProfileHeader';
import HistoryCard from '@/components/HistoryCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { getRankInfo, getRankColor } from '@/lib/ranks';
import type { User, Vote, Question, QuestionResults } from '@shared/schema';

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

  const { data: votes = [], isLoading: isLoadingVotes } = useQuery<Vote[]>({
    queryKey: ['/api/votes/mine'],
    enabled: !!user,
  });

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
      const optionLabels: Record<string, string> = {
        A: question.optionA,
        B: question.optionB,
        C: question.optionC || '',
        D: question.optionD || '',
      };

      const userChoiceLabel = optionLabels[vote.choice] || vote.choice;
      const pointsEarned = vote.pointsEarned || 0;
      const crowdSplitA = results ? results.percentA : 0;
      const crowdSplitB = results ? results.percentB : 0;

      let outcome: 'correct' | 'incorrect' | 'pending' = 'pending';
      let outcomeDescription: string | undefined;

      if (results) {
        const percentages = [
          { choice: 'A', percent: results.percentA },
          { choice: 'B', percent: results.percentB },
          { choice: 'C', percent: results.percentC || 0 },
          { choice: 'D', percent: results.percentD || 0 },
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
          <Skeleton className="h-32 w-full rounded-xl" />
        ) : currentUser ? (
          <ProfileHeader
            handle={currentUser.handle || '@User'}
            rank={currentUser.rank as 'Bronze' | 'Silver' | 'Gold' | 'Oracle'}
            winRate={0}
            streak={currentUser.currentStreak}
            totalPoints={currentUser.alphaPoints}
          />
        ) : null}

        {!isLoadingUser && currentUser && rankInfo && (
          <div className="p-6 rounded-3xl border border-border bg-card space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2" data-testid="rank-badge">
                <span className="text-2xl">{rankInfo.emoji}</span>
                <span className="font-semibold text-lg text-foreground">
                  {rankInfo.current}
                </span>
              </div>
              <div className="text-sm font-medium text-muted-foreground">
                α {currentUser.alphaPoints}
              </div>
            </div>

            <div className="space-y-2">
              <Progress 
                value={rankInfo.progressPercent} 
                className="h-2"
                data-testid="rank-progress"
              />
              {rankInfo.nextRank ? (
                <p className="text-sm text-muted-foreground" data-testid="rank-next">
                  Next Rank: {rankInfo.nextRank} ({rankInfo.pointsToNext} pts to go)
                </p>
              ) : (
                <p className="text-sm font-semibold text-foreground" data-testid="rank-next">
                  Max Rank Achieved!
                </p>
              )}
            </div>
          </div>
        )}

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
                  <Skeleton key={i} className="h-32 w-full rounded-xl" />
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
                  <Skeleton key={i} className="h-32 w-full rounded-xl" />
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
