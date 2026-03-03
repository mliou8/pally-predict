import { Eye, EyeOff } from 'lucide-react';
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
          Public (×2 PP)
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
          Private (×1 PP)
        </button>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {helperText}
        </p>
        <Badge
          variant="secondary"
          className="border"
          style={{ backgroundColor: 'rgba(255, 215, 0, 0.1)', borderColor: 'rgba(255, 215, 0, 0.3)' }}
        >
          <span className="font-bold mr-1" style={{ fontSize: '12px', color: '#FFD700' }}>×{multiplier}</span>
          <span style={{ color: '#FFD700' }}>PP</span>
        </Badge>
      </div>
    </div>
  );
}
