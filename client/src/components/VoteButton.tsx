import type { VoteChoice } from '@shared/schema';

interface VoteButtonProps {
  label: string;
  value: VoteChoice;
  disabled?: boolean;
  onSelect: (value: VoteChoice) => void;
}

export default function VoteButton({ label, value, disabled, onSelect }: VoteButtonProps) {
  return (
    <button
      onClick={() => onSelect(value)}
      disabled={disabled}
      className="w-full px-6 py-4 rounded-2xl border border-border bg-card text-foreground font-semibold text-lg hover-elevate active-elevate-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      data-testid={`vote-button-${value}`}
    >
      {label}
    </button>
  );
}
