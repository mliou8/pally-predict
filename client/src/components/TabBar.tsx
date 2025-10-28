import { Home, Trophy, History, User } from 'lucide-react';
import { Link, useLocation } from 'wouter';

export default function TabBar() {
  const [location] = useLocation();

  const tabs = [
    { icon: Home, label: 'Home', path: '/', testId: 'tab-home' },
    { icon: Trophy, label: 'Leaderboard', path: '/leaderboard', testId: 'tab-leaderboard' },
    { icon: History, label: 'History', path: '/history', testId: 'tab-history' },
    { icon: User, label: 'Profile', path: '/profile', testId: 'tab-profile' },
  ];

  return (
    <div className="fixed bottom-0 inset-x-0 bg-card/90 backdrop-blur border-t border-border md:hidden">
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location === tab.path;
          
          return (
            <Link key={tab.path} href={tab.path}>
              <button
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                  isActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover-elevate'
                }`}
                data-testid={tab.testId}
              >
                <Icon size={20} />
                <span className="text-xs font-medium">{tab.label}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-primary to-brand-magenta rounded-full" />
                )}
              </button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
