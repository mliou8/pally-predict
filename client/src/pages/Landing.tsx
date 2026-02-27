import { useEffect, useState } from 'react';
import { usePrivy, useLogin } from '@privy-io/react-auth';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import {
  Crosshair,
  Clock,
  Trophy,
  Download,
  Smartphone,
  MessageCircle,
  ChevronRight,
  Flame,
  Star,
} from 'lucide-react';
import Colors from '@/constants/colors';
import { cn } from '@/lib/utils';
import type { User } from '@shared/schema';

export default function Landing() {
  const { authenticated, ready, user } = usePrivy();
  const [, setLocation] = useLocation();
  const [heroVisible, setHeroVisible] = useState(false);
  const [sectionsVisible, setSectionsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Animation triggers
  useEffect(() => {
    const t1 = setTimeout(() => setHeroVisible(true), 100);
    const t2 = setTimeout(() => setSectionsVisible(true), 300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // PWA install detection
  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // Login hook
  const { login } = useLogin({
    onComplete: () => {
      setLocation('/play');
    },
    onError: (error) => {
      console.error('Login error:', error);
    },
  });

  // Fetch user data if authenticated
  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/user/me'],
    enabled: !!user,
  });

  // Handle Start Playing click
  const handleStartPlaying = () => {
    if (authenticated) {
      setLocation('/play');
    } else {
      login();
    }
  };

  // Handle PWA install
  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const isStandalone = typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches;

  // Loading state
  if (!ready) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: Colors.dark.background }}
      >
        <div
          className="w-8 h-8 border-4 rounded-full animate-spin"
          style={{ borderColor: Colors.dark.accent, borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: Colors.dark.background }}>
      <div className="max-w-lg mx-auto px-5 py-8 pb-12">
        {/* Hero Section */}
        <div
          className={cn(
            'text-center mb-12 transition-all duration-500',
            heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          )}
        >
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg"
              style={{
                backgroundColor: Colors.dark.accent,
                boxShadow: `0 8px 32px ${Colors.dark.accent}40`,
              }}
            >
              <span className="text-4xl font-black text-white">P</span>
            </div>
          </div>

          {/* Title & Tagline */}
          <h1
            className="text-3xl font-black tracking-[3px] mb-2"
            style={{ color: Colors.dark.text }}
          >
            PALLY PREDICT
          </h1>
          <p
            className="text-base font-medium mb-8"
            style={{ color: Colors.dark.textSecondary }}
          >
            Daily predictions. Wager points. Win big.
          </p>

          {/* CTA Button */}
          <button
            onClick={handleStartPlaying}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              backgroundColor: Colors.dark.accent,
              boxShadow: `0 8px 24px ${Colors.dark.accent}50`,
            }}
          >
            <Crosshair size={20} strokeWidth={2.5} />
            <span className="text-lg">{authenticated ? 'Start Playing' : 'Sign Up to Play'}</span>
            <ChevronRight size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* User Stats Preview (if authenticated) */}
        {authenticated && currentUser && (
          <div
            className={cn(
              'mb-10 transition-all duration-500 delay-100',
              sectionsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            <div
              className="rounded-2xl p-5 border"
              style={{ backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold"
                  style={{ backgroundColor: Colors.dark.accentDim, color: Colors.dark.accent }}
                >
                  {currentUser.handle?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <div className="font-bold" style={{ color: Colors.dark.text }}>
                    {currentUser.handle || 'Player'}
                  </div>
                  <div className="text-sm" style={{ color: Colors.dark.textMuted }}>
                    Welcome back!
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <div
                  className="flex-1 rounded-xl p-3 text-center border"
                  style={{ backgroundColor: Colors.dark.backgroundAlt, borderColor: Colors.dark.border }}
                >
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Star size={14} color={Colors.dark.warning} />
                    <span className="text-xs font-semibold" style={{ color: Colors.dark.textMuted }}>
                      POINTS
                    </span>
                  </div>
                  <div className="text-xl font-black" style={{ color: Colors.dark.text }}>
                    1,000
                  </div>
                </div>

                <div
                  className="flex-1 rounded-xl p-3 text-center border"
                  style={{ backgroundColor: Colors.dark.backgroundAlt, borderColor: Colors.dark.border }}
                >
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Flame size={14} color={Colors.dark.accent} />
                    <span className="text-xs font-semibold" style={{ color: Colors.dark.textMuted }}>
                      STREAK
                    </span>
                  </div>
                  <div className="text-xl font-black" style={{ color: Colors.dark.text }}>
                    0
                  </div>
                </div>

                <div
                  className="flex-1 rounded-xl p-3 text-center border"
                  style={{ backgroundColor: Colors.dark.backgroundAlt, borderColor: Colors.dark.border }}
                >
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Trophy size={14} color={Colors.dark.blue} />
                    <span className="text-xs font-semibold" style={{ color: Colors.dark.textMuted }}>
                      RANK
                    </span>
                  </div>
                  <div className="text-xl font-black" style={{ color: Colors.dark.text }}>
                    --
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* How It Works Section */}
        <div
          className={cn(
            'mb-10 transition-all duration-500 delay-150',
            sectionsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          <h2
            className="text-sm font-extrabold tracking-[2px] mb-4 text-center"
            style={{ color: Colors.dark.textMuted }}
          >
            HOW IT WORKS
          </h2>

          <div className="space-y-3">
            {/* Step 1 */}
            <div
              className="flex items-start gap-4 p-4 rounded-xl border"
              style={{ backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: Colors.dark.accentDim }}
              >
                <Clock size={20} color={Colors.dark.accent} />
              </div>
              <div>
                <div className="font-bold mb-1" style={{ color: Colors.dark.text }}>
                  Daily predictions drop at noon ET
                </div>
                <div className="text-sm" style={{ color: Colors.dark.textSecondary }}>
                  New questions every day covering sports, crypto, culture, and more.
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div
              className="flex items-start gap-4 p-4 rounded-xl border"
              style={{ backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: Colors.dark.blueDim }}
              >
                <Crosshair size={20} color={Colors.dark.blue} />
              </div>
              <div>
                <div className="font-bold mb-1" style={{ color: Colors.dark.text }}>
                  Vote on questions and wager points
                </div>
                <div className="text-sm" style={{ color: Colors.dark.textSecondary }}>
                  Lock in your prediction and decide how many points to wager.
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div
              className="flex items-start gap-4 p-4 rounded-xl border"
              style={{ backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: Colors.dark.successDim }}
              >
                <Trophy size={20} color={Colors.dark.success} />
              </div>
              <div>
                <div className="font-bold mb-1" style={{ color: Colors.dark.text }}>
                  Results reveal and winners get points
                </div>
                <div className="text-sm" style={{ color: Colors.dark.textSecondary }}>
                  Correct predictions earn points. Climb the leaderboard!
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Get the App Section */}
        <div
          className={cn(
            'mb-10 transition-all duration-500 delay-200',
            sectionsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          <h2
            className="text-sm font-extrabold tracking-[2px] mb-4 text-center"
            style={{ color: Colors.dark.textMuted }}
          >
            GET THE APP
          </h2>

          <div className="space-y-3">
            {/* PWA Install */}
            {!isStandalone && (
              <button
                onClick={handleInstall}
                className="w-full flex items-center gap-4 p-4 rounded-xl border transition-all hover:border-opacity-80"
                style={{ backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: Colors.dark.violetDim }}
                >
                  {isIOS ? (
                    <Smartphone size={20} color={Colors.dark.violet} />
                  ) : (
                    <Download size={20} color={Colors.dark.violet} />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-bold" style={{ color: Colors.dark.text }}>
                    {isIOS ? 'Add to Home Screen' : 'Install App'}
                  </div>
                  <div className="text-sm" style={{ color: Colors.dark.textSecondary }}>
                    {isIOS
                      ? 'Get the full app experience on iOS'
                      : 'Install for quick access and notifications'}
                  </div>
                </div>
                <ChevronRight size={20} color={Colors.dark.textMuted} />
              </button>
            )}

            {/* Telegram Bot */}
            <a
              href="https://t.me/PallyPredict_Bot"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-4 p-4 rounded-xl border transition-all hover:border-opacity-80"
              style={{ backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: Colors.dark.blueDim }}
              >
                <MessageCircle size={20} color={Colors.dark.blue} />
              </div>
              <div className="flex-1 text-left">
                <div className="font-bold" style={{ color: Colors.dark.text }}>
                  Play on Telegram
                </div>
                <div className="text-sm" style={{ color: Colors.dark.textSecondary }}>
                  Get daily predictions in Telegram
                </div>
              </div>
              <ChevronRight size={20} color={Colors.dark.textMuted} />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div
          className={cn(
            'text-center transition-all duration-500 delay-250',
            sectionsVisible ? 'opacity-100' : 'opacity-0'
          )}
        >
          <div className="flex items-center justify-center gap-4 text-sm">
            <a
              href="/terms"
              className="hover:underline"
              style={{ color: Colors.dark.textMuted }}
            >
              Terms of Service
            </a>
            <span style={{ color: Colors.dark.border }}>|</span>
            <a
              href="/privacy"
              className="hover:underline"
              style={{ color: Colors.dark.textMuted }}
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ backgroundColor: Colors.dark.surface }}
          >
            <div className="flex justify-between items-start mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: Colors.dark.accentDim }}
              >
                <Smartphone size={24} color={Colors.dark.accent} />
              </div>
              <button
                onClick={() => setShowIOSInstructions(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                style={{ color: Colors.dark.textMuted }}
              >
                ✕
              </button>
            </div>

            <h3 className="text-lg font-bold mb-2" style={{ color: Colors.dark.text }}>
              Add to Home Screen
            </h3>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                  style={{ backgroundColor: Colors.dark.accent, color: '#fff' }}
                >
                  1
                </div>
                <p className="text-sm" style={{ color: Colors.dark.textSecondary }}>
                  Tap the{' '}
                  <span className="font-semibold" style={{ color: Colors.dark.text }}>
                    Share
                  </span>{' '}
                  button at the bottom of Safari
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                  style={{ backgroundColor: Colors.dark.accent, color: '#fff' }}
                >
                  2
                </div>
                <p className="text-sm" style={{ color: Colors.dark.textSecondary }}>
                  Scroll down and tap{' '}
                  <span className="font-semibold" style={{ color: Colors.dark.text }}>
                    "Add to Home Screen"
                  </span>
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                  style={{ backgroundColor: Colors.dark.accent, color: '#fff' }}
                >
                  3
                </div>
                <p className="text-sm" style={{ color: Colors.dark.textSecondary }}>
                  Tap{' '}
                  <span className="font-semibold" style={{ color: Colors.dark.text }}>
                    "Add"
                  </span>{' '}
                  in the top right
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSInstructions(false)}
              className="w-full py-3 rounded-xl font-semibold transition-colors"
              style={{ backgroundColor: Colors.dark.border, color: Colors.dark.text }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
