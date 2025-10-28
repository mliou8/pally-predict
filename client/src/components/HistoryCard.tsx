import { CheckCircle2, XCircle, Zap, Eye, EyeOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface HistoryCardProps {
  question: string;
  choice: string;
  userChoiceLabel: string;
  outcome: 'correct' | 'incorrect' | 'pending';
  pointsEarned: number;
  timestamp: string;
  crowdSplitA: number;
  crowdSplitB: number;
  isPublic: boolean;
  outcomeDescription?: string;
}

export default function HistoryCard({
  question,
  choice,
  userChoiceLabel,
  outcome,
  pointsEarned,
  timestamp,
  crowdSplitA,
  crowdSplitB,
  isPublic,
  outcomeDescription
}: HistoryCardProps) {
  const isCorrect = outcome === 'correct';
  const isPending = outcome === 'pending';

  return (
    <div className="bg-card rounded-2xl p-4 border border-card-border hover-elevate" data-testid="history-card">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-muted-foreground">{new Date(timestamp).toLocaleDateString()}</span>
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
        {!isPending && (
          isCorrect ? (
            <CheckCircle2 className="text-success flex-shrink-0" size={20} />
          ) : (
            <XCircle className="text-destructive flex-shrink-0" size={20} />
          )
        )}
      </div>

      {!isPending && (
        <div className="flex gap-1 mb-3">
          <div className="flex-1 h-2 bg-primary/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary"
              style={{ width: `${crowdSplitA}%` }}
            />
          </div>
          <div className="flex-1 h-2 bg-brand-magenta/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-brand-magenta"
              style={{ width: `${crowdSplitB}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-xs gap-2">
        {outcomeDescription ? (
          <span className="text-muted-foreground">{outcomeDescription}</span>
        ) : isPending ? (
          <span className="text-muted-foreground">Result pending...</span>
        ) : (
          <span className="text-muted-foreground">{isCorrect ? 'Prediction correct' : 'Prediction incorrect'}</span>
        )}
        {isCorrect && pointsEarned > 0 && (
          <Badge variant="outline" className="text-xs font-mono inline-flex items-center gap-1">
            <Zap size={12} fill="currentColor" className="text-gold" />
            +{pointsEarned}
          </Badge>
        )}
      </div>
    </div>
  );
}
