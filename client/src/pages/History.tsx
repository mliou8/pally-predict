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
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">
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
              
              const outcome = results ? 'correct' : 'pending';
              const pointsEarned = vote.pointsEarned || 0;

              const crowdSplitA = results ? results.percentA : 0;
              const crowdSplitB = results ? results.percentB : 0;

              return (
                <HistoryCard
                  key={vote.id}
                  question={question.prompt}
                  userChoice={userChoiceLabel}
                  outcome={outcome as 'correct' | 'incorrect'}
                  pointsEarned={pointsEarned}
                  timestamp={vote.votedAt.toString()}
                  crowdSplitA={crowdSplitA}
                  crowdSplitB={crowdSplitB}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
