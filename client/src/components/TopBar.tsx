import { Bell, User } from 'lucide-react';
import { Link } from 'wouter';
import AlphaPointsPill from './AlphaPointsPill';
import Countdown from './Countdown';

interface TopBarProps {
  alphaPoints: number;
  nextDropTime?: string;
  onNotificationsClick?: () => void;
}

export default function TopBar({ alphaPoints, nextDropTime, onNotificationsClick }: TopBarProps) {
  return (
    <div className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b border-border">
      <div className="flex items-center justify-between px-4 md:px-6 py-3">
        <AlphaPointsPill points={alphaPoints} />
        
        <div className="flex flex-col items-center">
          <h1 className="font-display text-sm md:text-base font-semibold bg-gradient-to-r from-primary to-brand-magenta bg-clip-text text-transparent">
            PALLY ARENA
          </h1>
          {nextDropTime && (
            <div className="text-xs text-muted-foreground">
              Next question <Countdown to={nextDropTime} size="sm" />
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Link href="/profile">
            <button
              className="p-2 rounded-lg hover-elevate active-elevate-2"
              data-testid="button-profile"
            >
              <User size={20} className="text-foreground" />
            </button>
          </Link>
          <button
            onClick={onNotificationsClick}
            className="p-2 rounded-lg hover-elevate active-elevate-2"
            data-testid="button-notifications"
          >
            <Bell size={20} className="text-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
