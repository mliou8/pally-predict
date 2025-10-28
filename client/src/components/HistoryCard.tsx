import { CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface HistoryCardProps {
  question: string;
  userChoice: string;
  outcome: 'correct' | 'incorrect';
  pointsEarned: number;
  timestamp: string;
  crowdSplitA: number;
  crowdSplitB: number;
}

export default function HistoryCard({
  question,
  userChoice,
  outcome,
  pointsEarned,
  timestamp,
  crowdSplitA,
  crowdSplitB
}: HistoryCardProps) {
  const isCorrect = outcome === 'correct';

  return (
    <div className="bg-card rounded-2xl p-4 border border-card-border hover-elevate" data-testid="history-card">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground mb-1">{question}</p>
          <p className="text-xs text-muted-foreground">
            Your choice: <span className="text-foreground">{userChoice}</span>
          </p>
        </div>
        {isCorrect ? (
          <CheckCircle2 className="text-success flex-shrink-0 ml-2" size={20} />
        ) : (
          <XCircle className="text-destructive flex-shrink-0 ml-2" size={20} />
        )}
      </div>

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

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{new Date(timestamp).toLocaleDateString()}</span>
        {isCorrect && (
          <Badge variant="outline" className="text-xs font-mono">
            +{pointsEarned} α
          </Badge>
        )}
      </div>
    </div>
  );
}
