import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';
import VoteTypeToggle from './VoteTypeToggle';
import VoteButton from './VoteButton';
import Countdown from './Countdown';
import type { QuestionType, VoteChoice } from '@shared/schema';

interface PromptCardProps {
  questionType: QuestionType;
  question: string;
  closeAt: string;
  optionA: string;
  optionB: string;
  optionC?: string;
  optionD?: string;
  context?: string;
  onVote?: (choice: VoteChoice, isPublic: boolean) => void;
  disabled?: boolean;
  userChoice?: VoteChoice;
}

const categoryLabels: Record<QuestionType, string> = {
  consensus: '🎭 Consensus Arena',
  prediction: '📈 Prediction Arena',
  preference: '💎 Preference Arena',
};

export default function PromptCard({ 
  questionType,
  question, 
  closeAt, 
  optionA, 
  optionB,
  optionC,
  optionD,
  context,
  onVote,
  disabled = false,
  userChoice
}: PromptCardProps) {
  const [voteType, setVoteType] = useState<'public' | 'private'>('public');
  const hasVoted = disabled || !!userChoice;
  const selectedChoice = userChoice || null;

  const handleVote = (choice: VoteChoice) => {
    if (disabled || hasVoted) return;
    onVote?.(choice, voteType === 'public');
  };

  const getOptionLabel = (choice: VoteChoice): string => {
    const options: Record<VoteChoice, string> = {
      A: optionA,
      B: optionB,
      C: optionC || '',
      D: optionD || '',
    };
    return options[choice];
  };

  return (
    <div className="bg-card rounded-3xl p-6 md:p-8 border border-card-border shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
      <div className="flex items-center justify-between mb-4">
        <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-1">
          {categoryLabels[questionType]}
        </Badge>
        <Countdown to={closeAt} />
      </div>

      <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-2 text-center">
        {question}
      </h1>

      {context && (
        <p className="text-sm text-muted-foreground text-center mb-6">
          {context}
        </p>
      )}

      {!hasVoted ? (
        <>
          <div className="space-y-3 mb-6">
            <VoteButton label={optionA} value="A" onSelect={handleVote} />
            <VoteButton label={optionB} value="B" onSelect={handleVote} />
            {optionC && <VoteButton label={optionC} value="C" onSelect={handleVote} />}
            {optionD && <VoteButton label={optionD} value="D" onSelect={handleVote} />}
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
              {selectedChoice && getOptionLabel(selectedChoice)}
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
