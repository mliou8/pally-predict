import { Crosshair, Trophy, Clock, User, LogOut, HelpCircle, Info, BookOpen } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { usePrivy } from '@privy-io/react-auth';
import Colors from '@/constants/colors';
import { cn } from '@/lib/utils';

export default function DesktopSidebar() {
  const [location] = useLocation();
  const { user, logout } = usePrivy();

  const navItems = [
    { icon: Crosshair, label: 'Play', path: '/play' },
    { icon: Trophy, label: 'Leaderboard', path: '/leaderboard' },
    { icon: Clock, label: 'Past Polls', path: '/history' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  const infoItems = [
    { icon: BookOpen, label: 'How It Works', path: '/how-it-works' },
    { icon: Info, label: 'About', path: '/about' },
    { icon: HelpCircle, label: 'FAQ', path: '/faq' },
  ];

  return (
    <aside
      className="hidden md:flex flex-col w-64 min-h-screen fixed left-0 top-0 border-r"
      style={{
        backgroundColor: Colors.dark.background,
        borderColor: Colors.dark.border,
      }}
    >
      {/* Logo */}
      <div className="p-6 border-b" style={{ borderColor: Colors.dark.border }}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: Colors.dark.accent }}
          >
            <span className="text-lg font-black" style={{ color: '#000' }}>P</span>
          </div>
          <div>
            <div
              className="text-lg font-bold"
              style={{ color: Colors.dark.text }}
            >
              PALLY PREDICT
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 flex flex-col">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;

            return (
              <li key={item.path}>
                <Link href={item.path}>
                  <a
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                      'hover:bg-white/5',
                      isActive && 'bg-white/10'
                    )}
                  >
                    <Icon
                      size={20}
                      color={isActive ? Colors.dark.accent : Colors.dark.textMuted}
                      strokeWidth={isActive ? 2 : 1.5}
                    />
                    <span
                      className="text-sm font-medium"
                      style={{
                        color: isActive ? Colors.dark.text : Colors.dark.textMuted,
                      }}
                    >
                      {item.label}
                    </span>
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Info section - pushed to bottom of nav area */}
        <div className="mt-auto pt-4 border-t" style={{ borderColor: Colors.dark.border }}>
          <div className="text-xs font-medium px-4 mb-2" style={{ color: Colors.dark.textMuted }}>
            INFO
          </div>
          <ul className="space-y-1">
            {infoItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;

              return (
                <li key={item.path}>
                  <Link href={item.path}>
                    <a
                      className={cn(
                        'flex items-center gap-3 px-4 py-2 rounded-xl transition-all',
                        'hover:bg-white/5',
                        isActive && 'bg-white/10'
                      )}
                    >
                      <Icon
                        size={18}
                        color={isActive ? Colors.dark.accent : Colors.dark.textMuted}
                        strokeWidth={isActive ? 2 : 1.5}
                      />
                      <span
                        className="text-sm"
                        style={{
                          color: isActive ? Colors.dark.text : Colors.dark.textMuted,
                        }}
                      >
                        {item.label}
                      </span>
                    </a>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* User section */}
      {user && (
        <div className="p-4 border-t" style={{ borderColor: Colors.dark.border }}>
          <button
            onClick={() => logout()}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl w-full transition-all',
              'hover:bg-white/5'
            )}
          >
            <LogOut size={20} color={Colors.dark.textMuted} strokeWidth={1.5} />
            <span
              className="text-sm font-medium"
              style={{ color: Colors.dark.textMuted }}
            >
              Sign Out
            </span>
          </button>
        </div>
      )}
    </aside>
  );
}
