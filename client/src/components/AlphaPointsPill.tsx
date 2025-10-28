import { Zap } from 'lucide-react';

interface AlphaPointsPillProps {
  points: number;
}

export default function AlphaPointsPill({ points }: AlphaPointsPillProps) {
  return (
    <div 
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/20 to-brand-magenta/20 border border-primary/50"
      data-testid="alpha-points-pill"
    >
      <Zap className="text-gold" size={14} fill="currentColor" />
      <span className="text-sm font-bold font-mono text-foreground">
        {points.toLocaleString()}
      </span>
    </div>
  );
}
