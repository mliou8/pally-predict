import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { usePrivy } from '@privy-io/react-auth';
import { Link, useLocation } from 'wouter';
import { Trophy } from 'lucide-react';
import PromptCard from '@/components/PromptCard';
import ResultsReveal from '@/components/ResultsReveal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, ApiError } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import type { VoteChoice, Question, QuestionResults, Vote, User } from '@shared/schema';

interface VoteData {
  questionId: string;
  choice: VoteChoice;
  isPublic: boolean;
}

interface ResultWithQuestion {
  question: Question;
  results: QuestionResults;
  userVote: Vote | null;
}

export default function Home() {
  const { user } = usePrivy();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Check if user has a profile in the database
  // Wait a bit before enabling the query to ensure Privy is fully ready
  const [enableQuery, setEnableQuery] = useState(false);
  
  useEffect(() => {
    if (user) {
      // Add a small delay to ensure Privy user ID is properly set
      const timer = setTimeout(() => setEnableQuery(true), 300);
      return () => clearTimeout(timer);
    } else {
      setEnableQuery(false);
    }
  }, [user]);
  
  const { data: currentUser, isLoading: isLoadingUser, isError, error } = useQuery<User>({
    queryKey: ['/api/user/me'],
    enabled: enableQuery,
    retry: 3, // Retry 3 times for better reliability
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000), // Exponential backoff
    staleTime: 60000, // Cache for 1 minute
  });

  // Redirect to create-profile if user doesn't have a profile (404 only, not other errors)
  useEffect(() => {
    if (user && !isLoadingUser && isError && error) {
      // Only redirect on 404 (user not found), not on network/server errors
      if (error instanceof ApiError && error.status === 404) {
        setLocation('/create-profile');
      }
    }
  }, [user, isLoadingUser, isError, error, setLocation]);

  const { data: activeQuestions = [], isLoading: isLoadingActive } = useQuery<Question[]>({
    queryKey: ['/api/questions/active'],
    enabled: !!user && !!currentUser,
  });

  const { data: revealedQuestions = [], isLoading: isLoadingRevealed } = useQuery<Question[]>({
    queryKey: ['/api/questions/revealed'],
    enabled: !!user && !!currentUser,
  });

  const { data: userVotes = [] } = useQuery<Vote[]>({
    queryKey: ['/api/votes/mine'],
    enabled: !!user && !!currentUser,
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/seed/questions', { method: 'POST' });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/questions/active'] });
    },
  });

  useEffect(() => {
    if (user && activeQuestions.length === 0 && revealedQuestions.length === 0 && !isLoadingActive && !isLoadingRevealed && !seedMutation.isPending) {
      seedMutation.mutate();
    }
  }, [user, activeQuestions.length, revealedQuestions.length, isLoadingActive, isLoadingRevealed]);

  // Auto-refresh questions when reveal times pass
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      // Refresh queries to detect newly revealed questions
      queryClient.invalidateQueries({ queryKey: ['/api/questions/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/questions/revealed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/results/revealed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/votes/mine'] });
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  const voteMutation = useMutation({
    mutationFn: async (voteData: VoteData) => {
      if (!user?.id) throw new Error('Not authenticated');
      console.log('Submitting vote:', voteData);
      const response = await apiRequest('/api/votes', {
        method: 'POST',
        body: JSON.stringify(voteData),
      }, user.id);
      const result = await response.json();
      console.log('Vote response:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Vote succeeded:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/votes/mine'] });
      queryClient.invalidateQueries({ queryKey: ['/api/results/revealed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/questions/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/questions/revealed'] });
      toast({
        title: 'Vote submitted!',
        description: 'Your prediction has been locked in.',
      });
    },
    onError: (error: Error) => {
      console.error('Vote error:', error);
      // If user not found (404), redirect to create profile
      if (error instanceof ApiError && error.status === 404) {
        setLocation('/create-profile');
        toast({
          title: 'Profile Required',
          description: 'Please create your profile to vote',
        });
      } else {
        toast({
          title: 'Vote failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    },
  });

  const handleVote = (questionId: string, choice: VoteChoice, isPublic: boolean) => {
    voteMutation.mutate({ questionId, choice, isPublic });
  };

  const { data: resultsData = [] } = useQuery<ResultWithQuestion[]>({
    queryKey: ['/api/results/revealed', revealedQuestions.map(q => q.id).join(','), userVotes.length],
    queryFn: async () => {
      const results = await Promise.all(
        revealedQuestions.map(async (question) => {
          try {
            const resultsResponse = await fetch(`/api/results/${question.id}`);
            const results = await resultsResponse.json();
            
            const userVote = userVotes.find(v => v.questionId === question.id) || null;
            
            return { question, results, userVote };
          } catch (error) {
            return null;
          }
        })
      );
      return results.filter((r): r is ResultWithQuestion => r !== null);
    },
    enabled: !!user && revealedQuestions.length > 0 && userVotes.length >= 0,
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Please log in to continue</p>
      </div>
    );
  }

  // Show loading while waiting for user or while query is loading/retrying
  // Don't show error during retries - only after all retries exhausted
  if (!currentUser && (isLoadingUser || !isError)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Only show error after retries are exhausted and it's not a 404 (which redirects to create-profile)
  if (isError && error && !(error instanceof ApiError && error.status === 404)) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-destructive mb-2">Unable to load profile</p>
          <p className="text-sm text-muted-foreground mb-4">
            {error instanceof ApiError ? error.message : 'Please check your connection and try again'}
          </p>
          <Button onClick={() => window.location.reload()} variant="outline" data-testid="button-retry">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-6">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6">
        <div className="mb-6 flex justify-end">
          <Link href="/leaderboard">
            <Button variant="outline" className="gap-2" data-testid="button-leaderboard">
              <Trophy size={16} />
              Leaderboard
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="active" className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active" data-testid="tab-active">Active</TabsTrigger>
            <TabsTrigger value="results" data-testid="tab-results">Results</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-6">
            {isLoadingActive ? (
              <>
                <Skeleton className="h-64 w-full rounded-3xl" />
                <Skeleton className="h-64 w-full rounded-3xl" />
              </>
            ) : activeQuestions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-2">No active questions</p>
                <p className="text-sm text-muted-foreground">
                  {seedMutation.isPending ? 'Loading questions...' : 'Check back soon for new predictions!'}
                </p>
              </div>
            ) : (
              activeQuestions.map((question) => {
                const userVote = userVotes.find(v => v.questionId === question.id);
                const hasVoted = !!userVote;
                const revealTime = new Date(question.revealsAt).getTime();
                const hasRevealed = Date.now() > revealTime;

                // If user voted and question has revealed, show results
                if (hasVoted && hasRevealed && userVote) {
                  const resultData = resultsData.find(r => r.question.id === question.id);
                  
                  if (resultData) {
                    const optionLabels: Record<VoteChoice, string> = {
                      A: question.optionA,
                      B: question.optionB,
                      C: question.optionC || '',
                      D: question.optionD || '',
                    };

                    const resultsList: Array<{ choice: VoteChoice; label: string; percentage: number; votes: number; rank: number }> = [
                      { choice: 'A', label: question.optionA, percentage: resultData.results.percentA, votes: resultData.results.votesA, rank: 0 },
                      { choice: 'B', label: question.optionB, percentage: resultData.results.percentB, votes: resultData.results.votesB, rank: 0 },
                    ];

                    if (question.optionC) {
                      resultsList.push({ choice: 'C', label: question.optionC, percentage: resultData.results.percentC || 0, votes: resultData.results.votesC || 0, rank: 0 });
                    }
                    if (question.optionD) {
                      resultsList.push({ choice: 'D', label: question.optionD, percentage: resultData.results.percentD || 0, votes: resultData.results.votesD || 0, rank: 0 });
                    }

                    const sorted = [...resultsList].sort((a, b) => b.percentage - a.percentage);
                    sorted.forEach((item, index) => {
                      const original = resultsList.find(r => r.choice === item.choice);
                      if (original) original.rank = index + 1;
                    });

                    const multiplier = resultData.results.rarityMultipliers?.[userVote.choice] || 1;
                    const pointsEarned = userVote.pointsEarned || (100 * multiplier);

                    return (
                      <ResultsReveal
                        key={question.id}
                        question={question.prompt}
                        userChoice={userVote.choice}
                        userChoiceLabel={optionLabels[userVote.choice]}
                        results={resultsList}
                        pointsEarned={pointsEarned}
                        multiplier={multiplier}
                      />
                    );
                  }
                }

                // Otherwise show the prompt card
                return (
                  <PromptCard
                    key={question.id}
                    questionType={question.type}
                    question={question.prompt}
                    context={question.context || undefined}
                    closeAt={question.revealsAt.toString()}
                    optionA={question.optionA}
                    optionB={question.optionB}
                    optionC={question.optionC || undefined}
                    optionD={question.optionD || undefined}
                    onVote={(choice, isPublic) => handleVote(question.id, choice, isPublic)}
                    disabled={hasVoted || voteMutation.isPending}
                    userChoice={userVote?.choice}
                  />
                );
              })
            )}
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {isLoadingRevealed ? (
              <>
                <Skeleton className="h-80 w-full rounded-3xl" />
                <Skeleton className="h-80 w-full rounded-3xl" />
              </>
            ) : resultsData.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-2">No results yet</p>
                <p className="text-sm text-muted-foreground">
                  Vote on active questions to see results when they're revealed!
                </p>
              </div>
            ) : (
              resultsData.map(({ question, results, userVote }) => {
                if (!userVote) return null;

                const optionLabels: Record<VoteChoice, string> = {
                  A: question.optionA,
                  B: question.optionB,
                  C: question.optionC || '',
                  D: question.optionD || '',
                };

                const resultsList: Array<{ choice: VoteChoice; label: string; percentage: number; votes: number; rank: number }> = [
                  { choice: 'A', label: question.optionA, percentage: results.percentA, votes: results.votesA, rank: 0 },
                  { choice: 'B', label: question.optionB, percentage: results.percentB, votes: results.votesB, rank: 0 },
                ];

                if (question.optionC) {
                  resultsList.push({ choice: 'C', label: question.optionC, percentage: results.percentC || 0, votes: results.votesC || 0, rank: 0 });
                }
                if (question.optionD) {
                  resultsList.push({ choice: 'D', label: question.optionD, percentage: results.percentD || 0, votes: results.votesD || 0, rank: 0 });
                }

                const sorted = [...resultsList].sort((a, b) => b.percentage - a.percentage);
                sorted.forEach((item, index) => {
                  const original = resultsList.find(r => r.choice === item.choice);
                  if (original) original.rank = index + 1;
                });

                const multiplier = results.rarityMultipliers?.[userVote.choice] || 1;
                const pointsEarned = userVote.pointsEarned || (100 * multiplier);

                return (
                  <ResultsReveal
                    key={question.id}
                    question={question.prompt}
                    userChoice={userVote.choice}
                    userChoiceLabel={optionLabels[userVote.choice]}
                    results={resultsList}
                    pointsEarned={pointsEarned}
                    multiplier={multiplier}
                  />
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
