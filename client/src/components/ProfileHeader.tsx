import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface ProfileHeaderProps {
  handle: string;
  avatarUrl?: string;
  rank: 'Bronze' | 'Silver' | 'Gold' | 'Oracle';
  winRate: number;
  streak: number;
  totalPoints: number;
}

export default function ProfileHeader({ 
  handle, 
  avatarUrl, 
  rank, 
  winRate, 
  streak, 
  totalPoints 
}: ProfileHeaderProps) {
  const rankColors = {
    Bronze: 'bg-amber-700/20 text-amber-400 border-amber-700/50',
    Silver: 'bg-slate-400/20 text-slate-300 border-slate-400/50',
    Gold: 'bg-gold/20 text-gold border-gold/50',
    Oracle: 'bg-gradient-to-r from-primary/20 to-brand-magenta/20 text-primary border-primary/50'
  };

  return (
    <div className="bg-card rounded-3xl p-6 md:p-8 border border-card-border">
      <div className="flex items-center gap-4 mb-6">
        <Avatar className="h-20 w-20">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback className="text-2xl">{handle.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-foreground mb-2" data-testid="text-handle">
            {handle}
          </h2>
          <Badge className={rankColors[rank]}>
            Alpha Rank: {rank} Analyst
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 rounded-xl bg-muted">
          <div className="text-2xl font-bold font-mono text-foreground" data-testid="text-winrate">
            {winRate}%
          </div>
          <div className="text-xs text-muted-foreground">Win Rate</div>
        </div>
        <div className="text-center p-4 rounded-xl bg-muted">
          <div className="text-2xl font-bold font-mono text-foreground" data-testid="text-streak">
            {streak}
          </div>
          <div className="text-xs text-muted-foreground">Streak</div>
        </div>
        <div className="text-center p-4 rounded-xl bg-muted">
          <div className="text-2xl font-bold font-mono text-foreground" data-testid="text-points">
            {(totalPoints ?? 0).toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground">Points</div>
        </div>
      </div>
    </div>
  );
}
