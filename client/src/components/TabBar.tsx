import { Crosshair, Trophy, Clock, User } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import Colors from '@/constants/colors';
import { cn } from '@/lib/utils';

export default function TabBar() {
  const [location] = useLocation();

  const tabs = [
    { icon: Crosshair, label: 'Play', path: '/play' },
    { icon: Trophy, label: 'Ranks', path: '/leaderboard' },
    { icon: Clock, label: 'Polls', path: '/history' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <div
      className="fixed bottom-0 inset-x-0 md:hidden"
      style={{ backgroundColor: Colors.dark.background }}
    >
      {/* Top border line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ backgroundColor: Colors.dark.border }}
      />

      <div className="flex items-center justify-around py-3 pb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location === tab.path;

          return (
            <Link key={tab.path} href={tab.path}>
              <button
                className={cn(
                  'flex flex-col items-center gap-1 px-6 py-1 transition-all',
                  'active:scale-95'
                )}
              >
                <Icon
                  size={22}
                  color={isActive ? Colors.dark.accent : Colors.dark.textMuted}
                  strokeWidth={isActive ? 2 : 1.5}
                />
                <span
                  className="text-[10px] font-medium"
                  style={{
                    color: isActive ? Colors.dark.accent : Colors.dark.textMuted,
                  }}
                >
                  {tab.label}
                </span>
              </button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
