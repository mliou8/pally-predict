import { useEffect, useState } from 'react';
import { usePrivy, useLogin } from '@privy-io/react-auth';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, TrendingUp, Trophy, Zap } from 'lucide-react';
import Colors from '@/constants/colors';
import { cn } from '@/lib/utils';
import type { User } from '@shared/schema';

export default function Landing() {
  const { authenticated, ready, user } = usePrivy();
  const [, setLocation] = useLocation();
  const [contentVisible, setContentVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setContentVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const { login } = useLogin({
    onComplete: () => {
      setLocation('/play');
    },
    onError: (error) => {
      console.error('Login error:', error);
    },
  });

  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/user/me'],
    enabled: !!user,
  });

  const handleStartPlaying = () => {
    if (authenticated) {
      setLocation('/play');
    } else {
      login();
    }
  };

  if (!ready) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: Colors.dark.background }}
      >
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: Colors.dark.accent, borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: Colors.dark.background }}>
      <div className="max-w-lg mx-auto px-6 py-16 flex flex-col min-h-screen">
        {/* Hero */}
        <div
          className={cn(
            'flex-1 flex flex-col justify-center transition-all duration-700',
            contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
        >
          {/* Logo */}
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center mb-8"
            style={{ backgroundColor: Colors.dark.accent }}
          >
            <span className="text-3xl font-black" style={{ color: '#000' }}>P</span>
          </div>

          {/* Title */}
          <h1
            className="text-4xl font-bold leading-tight mb-4"
            style={{ color: Colors.dark.text }}
          >
            Predict. Compete.
            <br />
            <span style={{ color: Colors.dark.accent }}>Get rewarded.</span>
          </h1>

          {/* Subtitle */}
          <p
            className="text-lg mb-6"
            style={{ color: Colors.dark.textSecondary }}
          >
            Daily prediction game where the best predictors earn real rewards.
          </p>

          {/* Value Props */}
          <div
            className="flex items-center gap-6 mb-10 text-sm"
            style={{ color: Colors.dark.textMuted }}
          >
            <div className="flex items-center gap-2">
              <TrendingUp size={16} style={{ color: Colors.dark.accent }} />
              <span>Bet on outcomes</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy size={16} style={{ color: Colors.dark.accent }} />
              <span>Win 2-10x</span>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleStartPlaying}
            className={cn(
              'flex items-center justify-center gap-3 py-4 px-8 rounded-xl transition-all',
              'active:scale-[0.98]'
            )}
            style={{ backgroundColor: Colors.dark.accent }}
          >
            <span className="text-lg font-bold" style={{ color: '#000' }}>
              {authenticated ? 'Start Playing' : 'Get Started'}
            </span>
            <ArrowRight size={20} color="#000" strokeWidth={2.5} />
          </button>
        </div>

        {/* How it works */}
        <div
          className={cn(
            'py-12 transition-all duration-700 delay-200',
            contentVisible ? 'opacity-100' : 'opacity-0'
          )}
        >
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: Colors.dark.surface }}
              >
                <span
                  className="text-sm font-bold"
                  style={{
                    color: Colors.dark.accent,
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  01
                </span>
              </div>
              <div>
                <div className="font-semibold mb-1" style={{ color: Colors.dark.text }}>
                  New question daily at noon ET
                </div>
                <div className="text-sm" style={{ color: Colors.dark.textMuted }}>
                  Crypto, tech, markets, culture - predict what happens next
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: Colors.dark.surface }}
              >
                <span
                  className="text-sm font-bold"
                  style={{
                    color: Colors.dark.accent,
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  02
                </span>
              </div>
              <div>
                <div className="font-semibold mb-1" style={{ color: Colors.dark.text }}>
                  Place your bet, lock it in
                </div>
                <div className="text-sm" style={{ color: Colors.dark.textMuted }}>
                  Pick the underdog for bigger multipliers (up to 10x)
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: Colors.dark.surface }}
              >
                <span
                  className="text-sm font-bold"
                  style={{
                    color: Colors.dark.accent,
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  03
                </span>
              </div>
              <div>
                <div className="font-semibold mb-1" style={{ color: Colors.dark.text }}>
                  Win and climb the leaderboard
                </div>
                <div className="text-sm" style={{ color: Colors.dark.textMuted }}>
                  Top predictors earn SOL airdrops at 100 SOL volume
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={cn(
            'pt-6 border-t transition-all duration-700 delay-300',
            contentVisible ? 'opacity-100' : 'opacity-0'
          )}
          style={{ borderColor: Colors.dark.border }}
        >
          <div className="flex items-center justify-center gap-6 text-sm">
            <a
              href="/terms"
              style={{ color: Colors.dark.textMuted }}
            >
              Terms
            </a>
            <a
              href="/privacy"
              style={{ color: Colors.dark.textMuted }}
            >
              Privacy
            </a>
            <a
              href="https://t.me/PallyPredict_Bot"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: Colors.dark.textMuted }}
            >
              Telegram
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
