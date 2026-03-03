import { Crosshair, Trophy, Clock, User, LogOut, HelpCircle, Info, BookOpen, Download } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { usePrivy } from '@privy-io/react-auth';
import { SiTelegram } from 'react-icons/si';
import Colors from '@/constants/colors';
import { cn } from '@/lib/utils';
import Logo from '@/components/ui/Logo';

export default function DesktopSidebar() {
  const [location] = useLocation();
  const { user, logout } = usePrivy();

  const navItems = [
    { icon: Crosshair, label: 'Play', path: '/play' },
    { icon: Trophy, label: 'Leaderboard', path: '/leaderboard' },
    { icon: Clock, label: 'History', path: '/history' },
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
          <Logo size="md" />
          <div className="text-lg font-bold text-foreground">
            PALLY PREDICT
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

        {/* Get the App section */}
        <div className="pt-4 border-t" style={{ borderColor: Colors.dark.border }}>
          <div className="text-xs font-medium px-4 mb-2" style={{ color: Colors.dark.textMuted }}>
            GET THE APP
          </div>
          <ul className="space-y-1">
            <li>
              <a
                href="https://t.me/PallyPredict_Bot"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'flex items-center gap-3 px-4 py-2 rounded-xl transition-all',
                  'hover:bg-white/5'
                )}
              >
                <SiTelegram
                  size={18}
                  color={Colors.dark.textMuted}
                />
                <span
                  className="text-sm"
                  style={{ color: Colors.dark.textMuted }}
                >
                  Play on Telegram
                </span>
              </a>
            </li>
            <li>
              <button
                onClick={() => {
                  alert('To install the app, tap the share button in your browser and select "Add to Home Screen"');
                }}
                className={cn(
                  'flex items-center gap-3 px-4 py-2 rounded-xl transition-all w-full',
                  'hover:bg-white/5'
                )}
              >
                <Download
                  size={18}
                  color={Colors.dark.textMuted}
                  strokeWidth={1.5}
                />
                <span
                  className="text-sm"
                  style={{ color: Colors.dark.textMuted }}
                >
                  Install App (PWA)
                </span>
              </button>
            </li>
          </ul>
          <p
            className="text-xs px-4 mt-3"
            style={{ color: Colors.dark.textMuted }}
          >
            iOS App coming soon
          </p>
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
