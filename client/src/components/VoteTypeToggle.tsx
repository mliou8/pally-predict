import { Eye, EyeOff } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface VoteTypeToggleProps {
  value: 'public' | 'private';
  onChange: (value: 'public' | 'private') => void;
}

export default function VoteTypeToggle({ value, onChange }: VoteTypeToggleProps) {
  return (
    <div className="flex gap-2" data-testid="vote-type-toggle">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onChange('public')}
            className={`flex-1 px-4 py-2.5 rounded-xl border transition-all ${
              value === 'public'
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-muted border-border text-muted-foreground hover-elevate'
            }`}
            data-testid="toggle-public"
          >
            <Eye className="inline mr-2" size={16} />
            Public
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">Full rewards, affects Alpha Rank</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onChange('private')}
            className={`flex-1 px-4 py-2.5 rounded-xl border transition-all ${
              value === 'private'
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-muted border-border text-muted-foreground hover-elevate'
            }`}
            data-testid="toggle-private"
          >
            <EyeOff className="inline mr-2" size={16} />
            Private
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">Half rewards, off-record</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
