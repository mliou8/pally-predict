import { useQuery } from '@tanstack/react-query';
import { usePrivy } from '@privy-io/react-auth';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import ResultsReveal from '@/components/ResultsReveal';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { queryClient } from '@/lib/queryClient';
import type { Question, QuestionResults, Vote, VoteChoice } from '@shared/schema';

interface ResultWithQuestion {
  question: Question;
  results: QuestionResults | null;
  userVote: Vote | null;
  error?: boolean;
}

export default function AllResults() {
  const { user } = usePrivy();

  const { data: revealedQuestions = [], isLoading: isLoadingRevealed } = useQuery<Question[]>({
    queryKey: ['/api/questions/revealed'],
    enabled: !!user,
  });

  const { data: userVotes = [] } = useQuery<Vote[]>({
    queryKey: ['/api/votes/mine'],
    enabled: !!user,
  });

  const { data: resultsData = [], isLoading: isLoadingResults } = useQuery<ResultWithQuestion[]>({
    queryKey: ['/api/results/all', revealedQuestions.map(q => q.id).join(','), userVotes.length],
    queryFn: async () => {
      const results = await Promise.all(
        revealedQuestions.map(async (question) => {
          try {
            const resultsResponse = await fetch(`/api/results/${question.id}`);
            if (!resultsResponse.ok) {
              console.error(`Failed to fetch results for question ${question.id}`);
              return { 
                question, 
                results: null, 
                userVote: userVotes.find(v => v.questionId === question.id) || null,
                error: true
              };
            }
            const results = await resultsResponse.json();
            
            const userVote = userVotes.find(v => v.questionId === question.id) || null;
            
            return { question, results, userVote, error: false };
          } catch (error) {
            console.error(`Error fetching results for question ${question.id}:`, error);
            return { 
              question, 
              results: null, 
              userVote: userVotes.find(v => v.questionId === question.id) || null,
              error: true
            };
          }
        })
      );
      return results as ResultWithQuestion[];
    },
    enabled: !!user && revealedQuestions.length > 0,
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Please log in to view results</p>
      </div>
    );
  }

  const isLoading = isLoadingRevealed || isLoadingResults;

  return (
    <div className="min-h-screen pb-20 md:pb-6">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="text-2xl font-display font-bold bg-gradient-to-r from-primary to-brand-magenta bg-clip-text text-transparent">
            All Previous Results
          </h1>
        </div>

        <div className="space-y-6">
          {isLoading ? (
            <>
              <Skeleton className="h-80 w-full rounded-3xl" />
              <Skeleton className="h-80 w-full rounded-3xl" />
              <Skeleton className="h-80 w-full rounded-3xl" />
            </>
          ) : resultsData.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-2">No results yet</p>
              <p className="text-sm text-muted-foreground">
                Results will appear here after questions are revealed!
              </p>
            </div>
          ) : (
            resultsData.map(({ question, results, userVote, error }) => {
              // Show error state if results failed to load
              if (error || !results) {
                return (
                  <div key={question.id} className="bg-card rounded-3xl p-6 md:p-8 border border-destructive/30">
                    <div className="text-center">
                      <p className="text-destructive mb-2">Failed to load results</p>
                      <p className="text-sm text-muted-foreground mb-4">{question.prompt}</p>
                      <Button 
                        variant="outline" 
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/results/all'] })}
                        data-testid="button-retry-results"
                      >
                        Retry
                      </Button>
                    </div>
                  </div>
                );
              }

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
                    {sorted.map((result, index) => {
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
        </div>
      </div>
    </div>
  );
}
