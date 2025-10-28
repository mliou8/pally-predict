import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';
import VoteTypeToggle from './VoteTypeToggle';
import VoteButton from './VoteButton';
import Countdown from './Countdown';

interface PromptCardProps {
  category: 'Prediction Arena' | 'Consensus Arena';
  question: string;
  closeAt: string;
  optionA: string;
  optionB: string;
  onVote?: (side: 'A' | 'B', isPublic: boolean) => void;
}

export default function PromptCard({ 
  category, 
  question, 
  closeAt, 
  optionA, 
  optionB,
  onVote 
}: PromptCardProps) {
  const [voteType, setVoteType] = useState<'public' | 'private'>('public');
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedSide, setSelectedSide] = useState<'A' | 'B' | null>(null);

  const handleVote = (side: 'A' | 'B') => {
    setHasVoted(true);
    setSelectedSide(side);
    onVote?.(side, voteType === 'public');
    console.log(`Voted ${side} as ${voteType}`);
  };

  return (
    <div className="bg-card rounded-3xl p-6 md:p-8 border border-card-border shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
      <div className="flex items-center justify-between mb-4">
        <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-1">
          {category}
        </Badge>
        <Countdown to={closeAt} />
      </div>

      <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-6 text-center">
        {question}
      </h1>

      {!hasVoted ? (
        <>
          <div className="space-y-3 mb-6">
            <VoteButton label={optionA} value="A" onSelect={handleVote} />
            <VoteButton label={optionB} value="B" onSelect={handleVote} />
          </div>

          <VoteTypeToggle value={voteType} onChange={setVoteType} />
        </>
      ) : (
        <div className="text-center py-8">
          <CheckCircle2 className="inline-block text-success mb-4" size={48} />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Vote Locked ✅
          </h2>
          <p className="text-muted-foreground mb-1">
            You voted: <span className="text-foreground font-semibold">
              {selectedSide === 'A' ? optionA : optionB}
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            Your vote is private until results reveal.
          </p>
          <div className="mt-6 p-4 rounded-xl bg-muted">
            <p className="text-sm text-muted-foreground">
              Results reveal in:
            </p>
            <Countdown to={closeAt} size="md" />
          </div>
        </div>
      )}
    </div>
  );
}
