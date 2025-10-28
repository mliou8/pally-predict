interface VoteMeterProps {
  used: number;
  total: number;
}

export default function VoteMeter({ used, total }: VoteMeterProps) {
  return (
    <div className="flex items-center gap-2" data-testid="vote-meter">
      <span className="text-xs text-muted-foreground font-medium">Votes:</span>
      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full ${
              i < used ? 'bg-muted-foreground' : 'bg-primary'
            }`}
          />
        ))}
      </div>
      <span className="text-xs font-mono text-foreground">
        {total - used}/{total}
      </span>
    </div>
  );
}
