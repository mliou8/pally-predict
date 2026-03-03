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
          History
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
                Start voting on questions to build your track record
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
              let winningChoice = '';

              if (results) {
                const percentages = [
                  { choice: 'A', percent: results.percentA },
                  { choice: 'B', percent: results.percentB },
                  { choice: 'C', percent: results.percentC || 0 },
                  { choice: 'D', percent: results.percentD || 0 },
                ];
                const sorted = [...percentages].sort((a, b) => b.percent - a.percent);
                winningChoice = sorted[0].choice;
                const isMajority = vote.choice === winningChoice;

                outcome = isMajority ? 'correct' : 'incorrect';
                outcomeDescription = isMajority
                  ? `You predicted the majority (${sorted[0].percent}%)`
                  : `Majority chose ${winningChoice} (${sorted[0].percent}%)`;
              }

              const pointsEarned = vote.pointsEarned || 0;
              const betAmount = vote.betAmount ? parseFloat(vote.betAmount) : 0;
              const payout = vote.payout ? parseFloat(vote.payout) : null;

              // Build all options for expanded view
              const allOptions = results ? [
                { choice: 'A', label: question.optionA, percent: results.percentA, isUserChoice: vote.choice === 'A', isWinner: winningChoice === 'A' },
                { choice: 'B', label: question.optionB, percent: results.percentB, isUserChoice: vote.choice === 'B', isWinner: winningChoice === 'B' },
                ...(question.optionC ? [{ choice: 'C', label: question.optionC, percent: results.percentC || 0, isUserChoice: vote.choice === 'C', isWinner: winningChoice === 'C' }] : []),
                ...(question.optionD ? [{ choice: 'D', label: question.optionD, percent: results.percentD || 0, isUserChoice: vote.choice === 'D', isWinner: winningChoice === 'D' }] : []),
              ] : [];

              return (
                <HistoryCard
                  key={vote.id}
                  question={question.prompt}
                  choice={vote.choice}
                  userChoiceLabel={userChoiceLabel}
                  outcome={outcome}
                  pointsEarned={pointsEarned}
                  betAmount={betAmount}
                  payout={payout}
                  timestamp={vote.votedAt}
                  isPublic={vote.isPublic}
                  outcomeDescription={outcomeDescription}
                  allOptions={allOptions}
                  totalVotes={results?.totalVotes || 0}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
