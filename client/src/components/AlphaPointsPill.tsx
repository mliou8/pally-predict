interface AlphaPointsPillProps {
  points: number;
}

export default function AlphaPointsPill({ points }: AlphaPointsPillProps) {
  return (
    <div 
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/20 to-brand-magenta/20 border border-primary/50"
      data-testid="alpha-points-pill"
    >
      <span className="text-gold font-bold" style={{ fontSize: '14px' }}>α</span>
      <span className="text-sm font-bold font-mono text-foreground">
        {(points ?? 0).toLocaleString()}
      </span>
    </div>
  );
}
