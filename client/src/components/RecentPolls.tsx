import { useQuery } from '@tanstack/react-query';
import { usePrivy } from '@privy-io/react-auth';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Link } from 'wouter';
import Colors from '@/constants/colors';
import { cn } from '@/lib/utils';
import type { Vote, Question, QuestionResults } from '@shared/schema';

interface VoteWithDetails {
  vote: Vote;
  question: Question;
  results: QuestionResults | null;
}

export default function RecentPolls() {
  const { user } = usePrivy();

  const { data: votes = [] } = useQuery<Vote[]>({
    queryKey: ['/api/votes/mine'],
    enabled: !!user,
  });

  const { data: votesWithDetails = [], isLoading } = useQuery<VoteWithDetails[]>({
    queryKey: ['/api/votes/mine/details'],
    queryFn: async () => {
      const details = await Promise.all(
        votes.slice(0, 5).map(async (vote) => {
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
    return null;
  }

  const recentPolls = votesWithDetails.slice(0, 5);

  const getOutcome = (vote: Vote, results: QuestionResults | null) => {
    if (!results) return 'pending';
    const percentages = [
      { choice: 'A', percent: results.percentA },
      { choice: 'B', percent: results.percentB },
      { choice: 'C', percent: results.percentC || 0 },
      { choice: 'D', percent: results.percentD || 0 },
    ];
    const sorted = [...percentages].sort((a, b) => b.percent - a.percent);
    const topChoice = sorted[0].choice;
    return vote.choice === topChoice ? 'correct' : 'incorrect';
  };

  return (
    <div
      className="rounded-xl p-5"
      style={{ backgroundColor: Colors.dark.surface }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-sm font-semibold uppercase tracking-wider"
          style={{ color: Colors.dark.textMuted }}
        >
          Recent Polls
        </h3>
        <Link href="/history">
          <a
            className="text-xs font-medium hover:underline"
            style={{ color: Colors.dark.accent }}
          >
            View all
          </a>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-lg animate-pulse"
              style={{ backgroundColor: Colors.dark.background }}
            />
          ))}
        </div>
      ) : recentPolls.length === 0 ? (
        <p
          className="text-sm text-center py-6"
          style={{ color: Colors.dark.textMuted }}
        >
          No predictions yet
        </p>
      ) : (
        <div className="space-y-3">
          {recentPolls.map(({ vote, question, results }) => {
            const outcome = getOutcome(vote, results);
            const isPending = outcome === 'pending';
            const isCorrect = outcome === 'correct';

            return (
              <div
                key={vote.id}
                className={cn(
                  'p-3 rounded-lg border',
                  'transition-all hover:bg-white/5'
                )}
                style={{
                  backgroundColor: Colors.dark.background,
                  borderColor: Colors.dark.border,
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {isPending ? (
                      <Clock size={16} color={Colors.dark.textMuted} />
                    ) : isCorrect ? (
                      <CheckCircle2 size={16} color="#22c55e" />
                    ) : (
                      <XCircle size={16} color="#ef4444" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-medium line-clamp-2 mb-1"
                      style={{ color: Colors.dark.text }}
                    >
                      {question.prompt}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: Colors.dark.textMuted }}
                    >
                      You picked: <span style={{ color: Colors.dark.accent }}>{vote.choice}</span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
