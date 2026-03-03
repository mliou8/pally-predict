import { Trophy, User, Settings, LogOut } from 'lucide-react';
import { Link } from 'wouter';
import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TopBarProps {
  alphaPoints: number;
}

function getNextNoonET(): Date {
  const now = new Date();
  
  // Format current time in ET timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(now);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
  const second = parseInt(parts.find(p => p.type === 'second')?.value || '0');
  
  // Calculate if we've passed noon ET today
  const secondsSinceMidnight = hour * 3600 + minute * 60 + second;
  const noonInSeconds = 12 * 3600;
  const daysToAdd = secondsSinceMidnight >= noonInSeconds ? 1 : 0;
  
  // Build a date for the target day at noon
  const targetDate = new Date(now);
  targetDate.setDate(targetDate.getDate() + daysToAdd);
  
  const targetParts = formatter.formatToParts(targetDate);
  const targetYear = targetParts.find(p => p.type === 'year')?.value;
  const targetMonth = targetParts.find(p => p.type === 'month')?.value;
  const targetDay = targetParts.find(p => p.type === 'day')?.value;
  
  // Create a test date for the target day to check DST status on that specific day
  const testTargetDate = new Date(`${targetYear}-${targetMonth}-${targetDay}T12:00:00`);
  const targetTzString = testTargetDate.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    timeZoneName: 'short'
  });
  const isDST = targetTzString.includes('EDT');
  const offset = isDST ? '-04:00' : '-05:00';
  
  // Build ISO string with proper ET offset for the target date
  const noonET = new Date(`${targetYear}-${targetMonth}-${targetDay}T12:00:00${offset}`);
  
  return noonET;
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
  const { logout } = usePrivy();

  const handleLogout = () => {
    logout();
  };

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
              {(alphaPoints ?? 0).toLocaleString()}
            </span>
          </div>
        </div>
        
        {/* Center: PALLY ARENA Logo (clickable) */}
        <div className="flex justify-center">
          <Link href="/">
            <div className="flex flex-col items-center hover-elevate active-elevate-2 rounded-lg px-2 py-1 cursor-pointer" data-testid="link-home">
              <h1 className="font-display text-sm md:text-base font-semibold bg-gradient-to-r from-primary to-brand-magenta bg-clip-text text-transparent whitespace-nowrap">
                PALLY ARENA
              </h1>
              <UniversalTimer />
            </div>
          </Link>
        </div>
        
        {/* Right: Admin + Leaderboard + Profile Dropdown */}
        <div className="flex items-center justify-end gap-2">
          <Link href="/admin">
            <button
              className="p-2 rounded-lg hover-elevate active-elevate-2"
              data-testid="button-admin"
            >
              <Settings size={20} className="text-foreground" />
            </button>
          </Link>
          <Link href="/leaderboard">
            <button
              className="p-2 rounded-lg hover-elevate active-elevate-2"
              data-testid="button-leaderboard"
            >
              <Trophy size={20} className="text-foreground" />
            </button>
          </Link>
          
          {/* Profile Dropdown with Logout */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-2 rounded-lg hover-elevate active-elevate-2"
                data-testid="button-profile"
              >
                <User size={20} className="text-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" data-testid="dropdown-profile-menu">
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <div className="flex items-center gap-2 cursor-pointer w-full" data-testid="menu-item-profile">
                    <User size={16} />
                    <span>Profile</span>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleLogout}
                data-testid="menu-item-logout"
                className="cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <LogOut size={16} />
                  <span>Log Out</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
