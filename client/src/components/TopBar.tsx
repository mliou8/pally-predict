import { Trophy, User } from 'lucide-react';
import { Link } from 'wouter';
import { useEffect, useState } from 'react';

interface TopBarProps {
  alphaPoints: number;
}

function getNextNoonET(): Date {
  const now = new Date();
  
  // Create a date for today at 12pm ET (17:00 UTC in standard time, 16:00 UTC in daylight time)
  // For simplicity, using 17:00 UTC (12pm EST)
  const nextNoon = new Date(now);
  nextNoon.setUTCHours(17, 0, 0, 0);
  
  // If we've passed today's noon ET, move to tomorrow
  if (now >= nextNoon) {
    nextNoon.setDate(nextNoon.getDate() + 1);
  }
  
  return nextNoon;
}

function UniversalTimer() {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const nextNoon = getNextNoonET();
      const now = new Date();
      const diff = nextNoon.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('00:00:00');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-xs font-mono text-muted-foreground whitespace-nowrap" data-testid="universal-timer">
      Next Question in {timeLeft}
    </div>
  );
}

export default function TopBar({ alphaPoints }: TopBarProps) {
  return (
    <div className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b border-border">
      <div className="grid grid-cols-3 items-center px-4 md:px-6 py-3">
        {/* Left: Alpha Points */}
        <div className="flex justify-start">
          <div 
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/20 to-brand-magenta/20 border border-primary/50"
            data-testid="alpha-points-pill"
          >
            <span className="text-gold font-bold" style={{ fontSize: '14px' }}>α</span>
            <span className="text-sm font-bold font-mono text-foreground">
              {alphaPoints.toLocaleString()}
            </span>
          </div>
        </div>
        
        {/* Center: PALLY ARENA Logo (clickable) */}
        <Link href="/">
          <a className="flex flex-col items-center hover-elevate active-elevate-2 rounded-lg px-2 py-1" data-testid="link-home">
            <h1 className="font-display text-sm md:text-base font-semibold bg-gradient-to-r from-primary to-brand-magenta bg-clip-text text-transparent whitespace-nowrap">
              PALLY ARENA
            </h1>
            <UniversalTimer />
          </a>
        </Link>
        
        {/* Right: Leaderboard + Profile */}
        <div className="flex items-center justify-end gap-2">
          <Link href="/leaderboard">
            <button
              className="p-2 rounded-lg hover-elevate active-elevate-2"
              data-testid="button-leaderboard"
            >
              <Trophy size={20} className="text-foreground" />
            </button>
          </Link>
          <Link href="/profile">
            <button
              className="p-2 rounded-lg hover-elevate active-elevate-2"
              data-testid="button-profile"
            >
              <User size={20} className="text-foreground" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
