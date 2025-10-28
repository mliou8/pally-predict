import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';
import VoteTypeToggle from './VoteTypeToggle';
import VoteButton from './VoteButton';
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

  const isOptionSelected = (choice: VoteChoice) => selectedChoice === choice;

  return (
    <div className="bg-card rounded-3xl p-6 md:p-8 border border-card-border shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
      <div className="flex items-center justify-start mb-4">
        <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-1">
          {categoryLabels[questionType]}
        </Badge>
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
        <div className="space-y-4">
          <div className="text-center py-4">
            <CheckCircle2 className="inline-block text-success mb-3" size={48} />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Answer locked in ✅
            </h2>
            <p className="text-sm text-muted-foreground">
              Results reveal at 12 p.m. ET
            </p>
          </div>

          <div className="space-y-3">
            <div
              className={`w-full px-6 py-4 rounded-2xl border-2 transition-all ${
                isOptionSelected('A')
                  ? 'bg-primary/10 border-primary text-foreground ring-2 ring-primary'
                  : 'bg-muted/50 border-border text-muted-foreground opacity-50'
              }`}
              data-testid="vote-option-a-locked"
            >
              <span className="font-semibold">{optionA}</span>
              {isOptionSelected('A') && <span className="ml-2 text-primary">← Your answer</span>}
            </div>
            <div
              className={`w-full px-6 py-4 rounded-2xl border-2 transition-all ${
                isOptionSelected('B')
                  ? 'bg-primary/10 border-primary text-foreground ring-2 ring-primary'
                  : 'bg-muted/50 border-border text-muted-foreground opacity-50'
              }`}
              data-testid="vote-option-b-locked"
            >
              <span className="font-semibold">{optionB}</span>
              {isOptionSelected('B') && <span className="ml-2 text-primary">← Your answer</span>}
            </div>
            {optionC && (
              <div
                className={`w-full px-6 py-4 rounded-2xl border-2 transition-all ${
                  isOptionSelected('C')
                    ? 'bg-primary/10 border-primary text-foreground ring-2 ring-primary'
                    : 'bg-muted/50 border-border text-muted-foreground opacity-50'
                }`}
                data-testid="vote-option-c-locked"
              >
                <span className="font-semibold">{optionC}</span>
                {isOptionSelected('C') && <span className="ml-2 text-primary">← Your answer</span>}
              </div>
            )}
            {optionD && (
              <div
                className={`w-full px-6 py-4 rounded-2xl border-2 transition-all ${
                  isOptionSelected('D')
                    ? 'bg-primary/10 border-primary text-foreground ring-2 ring-primary'
                    : 'bg-muted/50 border-border text-muted-foreground opacity-50'
                }`}
                data-testid="vote-option-d-locked"
              >
                <span className="font-semibold">{optionD}</span>
                {isOptionSelected('D') && <span className="ml-2 text-primary">← Your answer</span>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
