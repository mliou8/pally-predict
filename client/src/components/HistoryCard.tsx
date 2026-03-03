import { useState } from 'react';
import { CheckCircle2, XCircle, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ResultOption {
  choice: string;
  label: string;
  percent: number;
  isUserChoice: boolean;
  isWinner: boolean;
}

interface HistoryCardProps {
  question: string;
  choice: string;
  userChoiceLabel: string;
  outcome: 'correct' | 'incorrect' | 'pending';
  pointsEarned: number;
  betAmount: number;
  payout: number | null;
  timestamp: string | Date;
  isPublic: boolean;
  outcomeDescription?: string;
  allOptions?: ResultOption[];
  totalVotes?: number;
}

export default function HistoryCard({
  question,
  choice,
  userChoiceLabel,
  outcome,
  pointsEarned,
  betAmount,
  payout,
  timestamp,
  isPublic,
  outcomeDescription,
  allOptions = [],
  totalVotes = 0
}: HistoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isCorrect = outcome === 'correct';
  const isPending = outcome === 'pending';

  // Format date safely
  const formatDate = (ts: string | Date): string => {
    try {
      const date = typeof ts === 'string' ? new Date(ts) : ts;
      if (isNaN(date.getTime())) return 'Date unavailable';
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Date unavailable';
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-card-border hover-elevate overflow-hidden" data-testid="history-card">
      {/* Main content - clickable to expand */}
      <button
        onClick={() => !isPending && setIsExpanded(!isExpanded)}
        className="w-full p-4 text-left"
        disabled={isPending}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-muted-foreground">{formatDate(timestamp)}</span>
              <Badge variant={isPublic ? "outline" : "secondary"} className="text-xs inline-flex items-center gap-1">
                {isPublic ? <Eye size={10} /> : <EyeOff size={10} />}
                {isPublic ? 'Public' : 'Private'}
              </Badge>
            </div>
            <p className="text-sm font-semibold text-foreground mb-2">{question}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs text-muted-foreground">
                Your answer: <span className="text-foreground font-semibold">{choice}</span> - {userChoiceLabel}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isPending && (
              isCorrect ? (
                <CheckCircle2 className="text-success flex-shrink-0" size={20} />
              ) : (
                <XCircle className="text-destructive flex-shrink-0" size={20} />
              )
            )}
            {!isPending && (
              isExpanded ? (
                <ChevronUp className="text-muted-foreground" size={16} />
              ) : (
                <ChevronDown className="text-muted-foreground" size={16} />
              )
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs gap-2">
          {outcomeDescription ? (
            <span className="text-muted-foreground">{outcomeDescription}</span>
          ) : isPending ? (
            <span className="text-muted-foreground">Result pending...</span>
          ) : (
            <span className="text-muted-foreground">{isCorrect ? 'You picked the majority!' : 'Not the majority this time'}</span>
          )}
          <div className="flex items-center gap-2">
            {betAmount > 0 && (
              <Badge variant="secondary" className="text-xs font-mono">
                Bet: {betAmount.toFixed(0)} pts
              </Badge>
            )}
            {!isPending && payout !== null && (
              <Badge
                variant="outline"
                className={`text-xs font-mono ${isCorrect ? 'text-success border-success' : 'text-destructive border-destructive'}`}
              >
                {isCorrect ? '+' : ''}{(payout - betAmount).toFixed(0)} pts
              </Badge>
            )}
          </div>
        </div>
      </button>

      {/* Expanded details */}
      {isExpanded && !isPending && allOptions.length > 0 && (
        <div className="px-4 pb-4 pt-2 border-t border-border">
          <div className="text-xs text-muted-foreground mb-3">
            {totalVotes > 0 ? `${totalVotes} total votes` : 'Results'}
          </div>
          <div className="space-y-2">
            {allOptions.map((option) => (
              <div key={option.choice} className="flex items-center gap-3">
                <div className="w-6 text-center">
                  <span
                    className={`text-xs font-bold ${option.isWinner ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    {option.choice}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs ${option.isUserChoice ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                      {option.label}
                    </span>
                    {option.isUserChoice && (
                      <span className="text-xs text-primary">(Your pick)</span>
                    )}
                    {option.isWinner && (
                      <span className="text-xs text-success">Winner</span>
                    )}
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${option.isWinner ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                      style={{ width: `${option.percent}%` }}
                    />
                  </div>
                </div>
                <div className="w-12 text-right">
                  <span className={`text-xs font-mono ${option.isWinner ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                    {option.percent}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
