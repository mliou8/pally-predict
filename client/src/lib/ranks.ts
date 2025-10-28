export type Rank = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';

export interface RankInfo {
  current: Rank;
  currentPoints: number;
  nextRank: Rank | null;
  pointsToNext: number;
  progressPercent: number;
  emoji: string;
}

const RANK_TIERS = [
  { rank: 'Bronze' as Rank, min: 0, max: 499, emoji: '🥉' },
  { rank: 'Silver' as Rank, min: 500, max: 999, emoji: '🥈' },
  { rank: 'Gold' as Rank, min: 1000, max: 1999, emoji: '🥇' },
  { rank: 'Platinum' as Rank, min: 2000, max: 3999, emoji: '💎' },
  { rank: 'Diamond' as Rank, min: 4000, max: Infinity, emoji: '💎' },
];

export function getRankInfo(alphaPoints: number): RankInfo {
  const currentTierIndex = RANK_TIERS.findIndex(
    tier => alphaPoints >= tier.min && alphaPoints <= tier.max
  );

  const currentTier = RANK_TIERS[currentTierIndex];
  const nextTier = currentTierIndex < RANK_TIERS.length - 1 
    ? RANK_TIERS[currentTierIndex + 1] 
    : null;

  const pointsToNext = nextTier ? nextTier.min - alphaPoints : 0;
  
  let progressPercent = 0;
  if (nextTier) {
    const tierRange = nextTier.min - currentTier.min;
    const currentProgress = alphaPoints - currentTier.min;
    progressPercent = (currentProgress / tierRange) * 100;
  } else {
    // Max rank achieved
    progressPercent = 100;
  }

  return {
    current: currentTier.rank,
    currentPoints: alphaPoints,
    nextRank: nextTier?.rank || null,
    pointsToNext,
    progressPercent: Math.min(100, Math.max(0, progressPercent)),
    emoji: currentTier.emoji,
  };
}

export function getRankColor(rank: Rank): string {
  const colors: Record<Rank, string> = {
    Bronze: 'from-amber-700 to-amber-900',
    Silver: 'from-slate-400 to-slate-600',
    Gold: 'from-yellow-400 to-yellow-600',
    Platinum: 'from-cyan-400 to-blue-500',
    Diamond: 'from-purple-400 to-pink-500',
  };
  return colors[rank];
}
