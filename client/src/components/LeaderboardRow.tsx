import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface LeaderboardRowProps {
  rank: number;
  avatarUrl?: string;
  handle: string;
  accuracyPct: number;
  points: number;
  badges?: string[];
  isCurrentUser?: boolean;
}

export default function LeaderboardRow({ 
  rank, 
  avatarUrl, 
  handle, 
  accuracyPct, 
  points, 
  badges = [],
  isCurrentUser = false 
}: LeaderboardRowProps) {
  return (
    <div 
      className={`grid grid-cols-[40px_1fr_auto] items-center gap-3 px-3 py-2 rounded-xl hover-elevate ${isCurrentUser ? 'bg-primary/10 border border-primary/50' : ''}`}
      data-testid={`leaderboard-row-${rank}`}
    >
      <div className="text-lg font-bold font-mono text-muted-foreground">
        {rank}
      </div>
      
      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback>{handle.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-foreground truncate" data-testid={`text-handle-${rank}`}>
            {handle}
          </div>
          <div className="flex gap-1.5 mt-0.5">
            {badges.map((badge, i) => (
              <span key={i} className="text-sm">{badge}</span>
            ))}
          </div>
        </div>
      </div>
      
      <div className="text-right">
        <div className="text-sm font-semibold text-foreground font-mono" data-testid={`text-points-${rank}`}>
          {points.toLocaleString()}
        </div>
        <div className="text-xs text-muted-foreground">
          {accuracyPct}% acc
        </div>
      </div>
    </div>
  );
}
