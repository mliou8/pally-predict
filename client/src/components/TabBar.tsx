import { Crosshair, Trophy, History, User } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import Colors from '@/constants/colors';

export default function TabBar() {
  const [location] = useLocation();

  const tabs = [
    { icon: Crosshair, label: 'Play', path: '/play', testId: 'tab-play' },
    { icon: Trophy, label: 'Ranks', path: '/leaderboard', testId: 'tab-leaderboard' },
    { icon: History, label: 'History', path: '/history', testId: 'tab-history' },
    { icon: User, label: 'Profile', path: '/profile', testId: 'tab-profile' },
  ];

  return (
    <div
      className="fixed bottom-0 inset-x-0 border-t md:hidden"
      style={{
        backgroundColor: Colors.dark.tabBar,
        borderColor: Colors.dark.tabBarBorder,
      }}
    >
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location === tab.path;

          return (
            <Link key={tab.path} href={tab.path}>
              <button
                className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all relative"
                data-testid={tab.testId}
              >
                <Icon
                  size={20}
                  color={isActive ? Colors.dark.accent : Colors.dark.textMuted}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span
                  className="text-[10px] font-semibold tracking-wide"
                  style={{ color: isActive ? Colors.dark.accent : Colors.dark.textMuted }}
                >
                  {tab.label}
                </span>
                {isActive && (
                  <div
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                    style={{ backgroundColor: Colors.dark.accent }}
                  />
                )}
              </button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
