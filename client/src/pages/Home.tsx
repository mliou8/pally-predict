import { useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { usePrivy, useLogin } from '@privy-io/react-auth';
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
  wagerAmount?: string;
}

interface ResultWithQuestion {
  question: Question;
  results: QuestionResults;
  userVote: Vote | null;
}

export default function Home() {
  const { user, authenticated, ready } = usePrivy();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // State to track pending vote when user needs to log in first
  const [pendingVote, setPendingVote] = useState<VoteData | null>(null);

  // Login hook for unauthenticated users trying to vote
  const { login } = useLogin({
    onComplete: () => {
      // After login, the vote will be processed via useEffect below
    },
    onError: (error) => {
      console.error('Login error:', error);
      setPendingVote(null);
      toast({
        title: 'Login failed',
        description: 'Please try again',
        variant: 'destructive',
      });
    },
  });

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

  // Active questions are public - anyone can view them
  const { data: activeQuestions = [], isLoading: isLoadingActive } = useQuery<Question[]>({
    queryKey: ['/api/questions/active'],
    enabled: ready, // Enable as soon as Privy is ready, no auth required
  });

  // Revealed questions are also public
  const { data: revealedQuestions = [], isLoading: isLoadingRevealed } = useQuery<Question[]>({
    queryKey: ['/api/questions/revealed'],
    enabled: ready,
  });

  // User votes require authentication
  const { data: userVotes = [] } = useQuery<Vote[]>({
    queryKey: ['/api/votes/mine'],
    enabled: !!user && !!currentUser,
  });

  // Auto-seeding disabled - questions are added via admin or scripts

  // Auto-refresh questions when reveal times pass
  useEffect(() => {
    if (!ready) return;

    const interval = setInterval(() => {
      // Refresh queries to detect newly revealed questions
      queryClient.invalidateQueries({ queryKey: ['/api/questions/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/questions/revealed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/results/revealed'] });
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['/api/votes/mine'] });
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [ready, user]);

  const voteMutation = useMutation({
    mutationFn: async (voteData: VoteData) => {
      if (!user?.id) throw new Error('Not authenticated');
      console.log('Submitting vote:', voteData);
      
      // Use the new wager/initiate endpoint
      const response = await apiRequest('/api/wager/initiate', {
        method: 'POST',
        body: JSON.stringify(voteData),
      }, user.id);
      const result = await response.json();
      console.log('Vote response:', result);
      
      // Wager verification happens through the wallet transaction flow
      // The user must complete the real Solana transaction via LinkWallet page
      // Server will verify the actual on-chain transaction before confirming the wager

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
        description: data.wagerAmount && BigInt(data.wagerAmount) > BigInt(0) 
          ? `Your prediction with ${(Number(data.wagerAmount) / 1e9).toFixed(4)} SOL wager has been locked in.`
          : 'Your prediction has been locked in.',
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
      } else if (error.message.includes('link a Solana wallet')) {
        setLocation('/link-wallet');
        toast({
          title: 'Wallet Required',
          description: 'Please link your Phantom wallet to place bets',
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

  const handleVote = useCallback((questionId: string, choice: VoteChoice, isPublic: boolean, wagerSol?: string) => {
    // Convert SOL to lamports if wager is provided (1 SOL = 1e9 lamports)
    let wagerAmount: string | undefined;
    if (wagerSol && parseFloat(wagerSol) > 0) {
      const lamportsAmount = BigInt(Math.floor(parseFloat(wagerSol) * 1e9));
      wagerAmount = lamportsAmount.toString();
    }

    const voteData = { questionId, choice, isPublic, wagerAmount };

    // If user is not authenticated, trigger login and save pending vote
    if (!authenticated || !user) {
      setPendingVote(voteData);
      login();
      return;
    }

    voteMutation.mutate(voteData);
  }, [authenticated, user, login, voteMutation]);

  // Process pending vote after successful login and profile check
  useEffect(() => {
    if (pendingVote && authenticated && user && currentUser) {
      // User is now authenticated and has a profile, submit the pending vote
      voteMutation.mutate(pendingVote);
      setPendingVote(null);
    }
  }, [pendingVote, authenticated, user, currentUser, voteMutation]);

  const { data: resultsData = [] } = useQuery<ResultWithQuestion[]>({
    queryKey: ['/api/results/revealed', revealedQuestions.map(q => q.id).join(','), userVotes.length],
    queryFn: async () => {
      const results = await Promise.all(
        revealedQuestions.map(async (question) => {
          try {
            const resultsResponse = await fetch(`/api/results/${question.id}`);
            let results = await resultsResponse.json();

            // Generate mock results if none exist
            if (!results || resultsResponse.status === 404) {
              const seed = question.id.charCodeAt(0) + question.id.charCodeAt(1);
              const userVote = userVotes.find(v => v.questionId === question.id);
              const isUserCorrect = userVote ? (seed % 3 !== 0) : false; // 66% win rate for users

              // Determine winning option
              let winningChoice: 'A' | 'B' | 'C' | 'D' = 'A';
              if (userVote && isUserCorrect) {
                winningChoice = userVote.choice as 'A' | 'B' | 'C' | 'D';
              } else if (userVote) {
                const options: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B'];
                if (question.optionC) options.push('C');
                if (question.optionD) options.push('D');
                const otherOptions = options.filter(opt => opt !== userVote.choice);
                winningChoice = otherOptions[seed % otherOptions.length] as 'A' | 'B' | 'C' | 'D';
              } else {
                winningChoice = seed % 2 === 0 ? 'A' : 'B';
              }

              // Generate percentages
              const percentages: Record<string, number> = { A: 20, B: 20, C: 20, D: 20 };
              percentages[winningChoice] = 40 + (seed % 20);

              const remaining = 100 - percentages[winningChoice];
              const otherOptions = ['A', 'B', 'C', 'D'].filter(opt => opt !== winningChoice);
              otherOptions.forEach((opt) => {
                if ((opt === 'C' && !question.optionC) || (opt === 'D' && !question.optionD)) {
                  percentages[opt] = 0;
                } else {
                  percentages[opt] = Math.floor(remaining / otherOptions.filter(o =>
                    !((o === 'C' && !question.optionC) || (o === 'D' && !question.optionD))
                  ).length);
                }
              });

              const totalVotes = 50 + (seed % 100);
              results = {
                id: question.id + '-results',
                questionId: question.id,
                percentA: percentages.A,
                percentB: percentages.B,
                percentC: percentages.C || null,
                percentD: percentages.D || null,
                votesA: Math.floor((percentages.A / 100) * totalVotes),
                votesB: Math.floor((percentages.B / 100) * totalVotes),
                votesC: percentages.C ? Math.floor((percentages.C / 100) * totalVotes) : null,
                votesD: percentages.D ? Math.floor((percentages.D / 100) * totalVotes) : null,
                totalVotes,
                rarityMultipliers: { A: 1.2, B: 1.5, C: 1.0, D: 1.0 },
                revealedAt: new Date(),
              };
            }

            const userVote = userVotes.find(v => v.questionId === question.id) || null;

            return { question, results, userVote };
          } catch (error) {
            return null;
          }
        })
      );
      return results.filter((r): r is ResultWithQuestion => r !== null);
    },
    // Enable for authenticated users with revealed questions, or for unauthenticated users viewing results
    enabled: ready && revealedQuestions.length > 0,
  });

  // Show loading while Privy initializes
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // For authenticated users, show loading while checking profile
  // But only if they're authenticated and we're still loading their profile
  if (authenticated && user && !currentUser && (isLoadingUser || !isError)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Only show error for authenticated users after retries are exhausted and it's not a 404
  if (authenticated && isError && error && !(error instanceof ApiError && error.status === 404)) {
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
                  Check back soon for new predictions!
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

                    const pointsEarned = userVote.pointsEarned || 100;

                    return (
                      <ResultsReveal
                        key={question.id}
                        question={question.prompt}
                        userChoice={userVote.choice}
                        userChoiceLabel={optionLabels[userVote.choice]}
                        results={resultsList}
                        pointsEarned={pointsEarned}
                        questionDate={question.dropsAt.toString()}
                        isPublic={userVote.isPublic}
                        userWager={userVote.wagerAmount}
                        userPayout={userVote.payoutAmount || undefined}
                        totalPot={resultData.results.totalPot || undefined}
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
                    onVote={(choice, isPublic, wagerAmount) => handleVote(question.id, choice, isPublic, wagerAmount)}
                    disabled={hasVoted || voteMutation.isPending}
                    userChoice={userVote?.choice}
                    userWager={userVote?.wagerAmount}
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
                  Check back after questions are revealed to see results!
                </p>
              </div>
            ) : (
              resultsData.map(({ question, results, userVote }) => {
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

                // If user voted, show their details
                if (userVote) {
                  const pointsEarned = userVote.pointsEarned || 100;

                  return (
                    <ResultsReveal
                      key={question.id}
                      question={question.prompt}
                      userChoice={userVote.choice}
                      userChoiceLabel={optionLabels[userVote.choice]}
                      results={resultsList}
                      pointsEarned={pointsEarned}
                      questionDate={question.dropsAt.toString()}
                      isPublic={userVote.isPublic}
                      userWager={userVote.wagerAmount}
                      userPayout={userVote.payoutAmount || undefined}
                      totalPot={results.totalPot || undefined}
                    />
                  );
                }

                // If user didn't vote, show results without user-specific info
                return (
                  <div key={question.id} className="bg-card rounded-3xl p-6 md:p-8 border border-card-border shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs text-muted-foreground" data-testid="text-result-date">
                        {new Date(question.dropsAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">
                        No vote
                      </span>
                    </div>

                    <h2 className="text-xl font-semibold mb-6 text-center bg-gradient-to-r from-primary to-brand-magenta bg-clip-text text-transparent">
                      Results
                    </h2>

                    <div className="mb-6">
                      <p className="text-sm text-muted-foreground mb-3 text-center">{question.prompt}</p>
                    </div>

                    <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-brand-magenta/10 border border-primary/20">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-1">Majority prediction</div>
                        <div className="text-lg font-bold bg-gradient-to-r from-primary to-brand-magenta bg-clip-text text-transparent" data-testid="text-majority-prediction">
                          {sorted[0].choice} - {sorted[0].label}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {sorted[0].percentage}% of voters
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {sorted.map((result) => {
                        const rankColors = {
                          1: 'from-yellow-400 to-yellow-600',
                          2: 'from-gray-300 to-gray-500',
                          3: 'from-orange-400 to-orange-600',
                          4: 'from-slate-400 to-slate-600',
                        };
                        
                        const getRankEmoji = (rank: number) => {
                          const emojis: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉', 4: '4️⃣' };
                          return emojis[rank] || '';
                        };

                        const barColor = rankColors[result.rank as keyof typeof rankColors] || 'from-slate-400 to-slate-600';
                        
                        return (
                          <div
                            key={result.choice}
                            className="relative rounded-xl overflow-hidden"
                          >
                            <div className="relative p-4 bg-muted">
                              <div
                                style={{ width: `${result.percentage}%` }}
                                className={`absolute inset-0 bg-gradient-to-r ${barColor} opacity-20`}
                              />
                              
                              <div className="relative flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">{getRankEmoji(result.rank)}</span>
                                  <div>
                                    <div className="font-semibold text-foreground">{result.label}</div>
                                    <div className="text-xs text-muted-foreground">{result.votes} votes</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-2xl font-bold bg-gradient-to-r from-primary to-brand-magenta bg-clip-text text-transparent">
                                    {result.percentage}%
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
