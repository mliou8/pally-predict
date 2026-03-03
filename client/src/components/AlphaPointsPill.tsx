interface AlphaPointsPillProps {
  points: number;
}

// This component displays Pally Points (PP) - kept as AlphaPointsPill for backwards compatibility
export default function AlphaPointsPill({ points }: AlphaPointsPillProps) {
  return (
    <div
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
      style={{ backgroundColor: 'rgba(255, 215, 0, 0.1)', borderColor: 'rgba(255, 215, 0, 0.3)' }}
      data-testid="pally-points-pill"
    >
      <span className="text-sm font-bold font-mono" style={{ color: '#FFD700' }}>
        {(points ?? 0).toLocaleString()}
      </span>
      <span className="text-xs font-semibold" style={{ color: '#FFD700' }}>PP</span>
    </div>
  );
}
