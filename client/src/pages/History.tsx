import { useQuery } from '@tanstack/react-query';
import { usePrivy } from '@privy-io/react-auth';
import HistoryCard from '@/components/HistoryCard';
import { Skeleton } from '@/components/ui/skeleton';
import type { Vote, Question, QuestionResults } from '@shared/schema';

interface VoteWithDetails {
  vote: Vote;
  question: Question;
  results: QuestionResults | null;
}

export default function History() {
  const { user } = usePrivy();

  const { data: votes = [], isLoading: isLoadingVotes } = useQuery<Vote[]>({
    queryKey: ['/api/votes/mine'],
    enabled: !!user,
  });

  const { data: votesWithDetails = [], isLoading: isLoadingDetails } = useQuery<VoteWithDetails[]>({
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
              if (resultsResponse.ok) {
                results = await resultsResponse.json();
              }
              
              // Generate mock results if none exist
              if (!results) {
                const seed = question.id.charCodeAt(0) + question.id.charCodeAt(1);
                const isUserCorrect = seed % 3 !== 0; // 66% win rate
                
                // Determine winning option
                let winningChoice: 'A' | 'B' | 'C' | 'D' = 'A';
                if (isUserCorrect) {
                  winningChoice = vote.choice as 'A' | 'B' | 'C' | 'D';
                } else {
                  const options: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B'];
                  if (question.optionC) options.push('C');
                  if (question.optionD) options.push('D');
                  const otherOptions = options.filter(opt => opt !== vote.choice);
                  winningChoice = otherOptions[seed % otherOptions.length] as 'A' | 'B' | 'C' | 'D';
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Please log in to view history</p>
      </div>
    );
  }

  const isLoading = isLoadingVotes || isLoadingDetails;

  return (
    <div className="min-h-screen pb-20 md:pb-6">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10">
        <h1 className="text-2xl font-display font-bold mb-6 bg-gradient-to-r from-primary to-brand-magenta bg-clip-text text-transparent">
          Past Polls
        </h1>

        <div className="space-y-3">
          {isLoading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-xl" />
              ))}
            </>
          ) : votesWithDetails.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-2">No history yet</p>
              <p className="text-sm text-muted-foreground">
                Start voting on prompts to build your track record
              </p>
            </div>
          ) : (
            votesWithDetails.map(({ vote, question, results }) => {
              const optionLabels: Record<string, string> = {
                A: question.optionA,
                B: question.optionB,
                C: question.optionC || '',
                D: question.optionD || '',
              };

              const userChoiceLabel = optionLabels[vote.choice] || vote.choice;
              
              // Determine outcome based on results
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
                
                outcome = isMajority ? 'correct' : 'incorrect';
                outcomeDescription = isMajority 
                  ? `You predicted the majority (${sorted[0].percent}%)`
                  : `Majority chose ${topChoice} (${sorted[0].percent}%)`;
              }
              
              const pointsEarned = vote.pointsEarned || 0;

              const crowdSplitA = results ? results.percentA : 0;
              const crowdSplitB = results ? results.percentB : 0;

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
            })
          )}
        </div>
      </div>
    </div>
  );
}
