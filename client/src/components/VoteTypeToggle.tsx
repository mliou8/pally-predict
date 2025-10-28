import { Eye, EyeOff, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface VoteTypeToggleProps {
  value: 'public' | 'private';
  onChange: (value: 'public' | 'private') => void;
}

export default function VoteTypeToggle({ value, onChange }: VoteTypeToggleProps) {
  const multiplier = value === 'public' ? 2 : 1;
  const helperText = value === 'public' 
    ? 'Your answer will appear on your profile & public feeds.'
    : 'Only you can see this in History.';

  return (
    <div className="space-y-3" data-testid="vote-type-toggle">
      <div className="flex gap-2">
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
          Public (×2 points)
        </button>

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
          Private (×1 point)
        </button>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {helperText}
        </p>
        <Badge 
          variant="secondary" 
          className="bg-gradient-to-r from-primary/20 to-brand-magenta/20 border-primary/50"
        >
          <Zap className="inline mr-1" size={12} fill="currentColor" />
          ×{multiplier} Point{multiplier > 1 ? 's' : ''}
        </Badge>
      </div>
    </div>
  );
}
