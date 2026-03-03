import { useEffect, useState } from 'react';
import { usePrivy, useLogin } from '@privy-io/react-auth';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Users, Trophy, Clock, Coins, CheckCircle, ChevronRight, Shield, Zap } from 'lucide-react';
import Colors from '@/constants/colors';
import { cn } from '@/lib/utils';
import Logo from '@/components/ui/Logo';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  const features = [
    {
      icon: Users,
      title: 'Majority Wins',
      description: 'The most popular answer wins. Pick what you think most people will pick.',
    },
    {
      icon: Trophy,
      title: 'Split the Pot',
      description: 'Everyone who picks the winning answer shares the prize pool.',
    },
    {
      icon: Clock,
      title: 'Daily Game',
      description: 'New question at noon ET. Results and payouts 24 hours later.',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'See the daily question',
      description: 'Topics range from crypto to culture. One question per day.',
    },
    {
      number: '02',
      title: 'Pick what most people will pick',
      description: 'Think like the crowd. The most popular answer wins.',
    },
    {
      number: '03',
      title: 'Winners split the prize',
      description: 'If you picked the majority answer, you share the pot.',
    },
  ];

  const stats = [
    { value: '1,000+', label: 'Daily Players' },
    { value: '24hr', label: 'Question Cycle' },
    { value: '100pts', label: 'Winner Reward' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: Colors.dark.background }}>
      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div
          className={cn(
            'flex flex-col lg:flex-row lg:items-center lg:gap-16 transition-all duration-700',
            contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
        >
          {/* Left side - Text */}
          <div className="flex-1 mb-12 lg:mb-0">
            {/* Logo */}
            <div className="mb-8">
              <Logo size="lg" />
            </div>

            {/* Title */}
            <h1
              className="text-4xl lg:text-5xl font-bold leading-tight mb-6"
              style={{ color: Colors.dark.text }}
            >
              Think like the crowd.
              <br />
              <span style={{ color: Colors.dark.accent }}>Win the prize.</span>
            </h1>

            {/* Subtitle */}
            <p
              className="text-lg lg:text-xl mb-8"
              style={{ color: Colors.dark.textSecondary }}
            >
              Daily questions, one simple rule: <strong style={{ color: Colors.dark.text }}>pick what most people pick</strong>.
              The majority answer wins and splits the pot.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button
                onClick={handleStartPlaying}
                className={cn(
                  'flex items-center justify-center gap-3 py-4 px-8 rounded-xl transition-all',
                  'active:scale-[0.98] hover:opacity-90'
                )}
                style={{ backgroundColor: Colors.dark.accent }}
              >
                <span className="text-lg font-bold" style={{ color: '#000' }}>
                  {authenticated ? 'Start Playing' : 'Get Started'}
                </span>
                <ArrowRight size={20} color="#000" strokeWidth={2.5} />
              </button>
              <Link href="/how-it-works">
                <a
                  className={cn(
                    'flex items-center justify-center gap-2 py-4 px-8 rounded-xl transition-all',
                    'hover:bg-white/10 border'
                  )}
                  style={{ borderColor: Colors.dark.border, color: Colors.dark.text }}
                >
                  How It Works
                  <ChevronRight size={18} />
                </a>
              </Link>
            </div>

            {/* Trust badges */}
            <div
              className="flex items-center gap-6 text-sm"
              style={{ color: Colors.dark.textMuted }}
            >
              <div className="flex items-center gap-2">
                <Shield size={16} style={{ color: Colors.dark.accent }} />
                <span>Fair play guaranteed</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap size={16} style={{ color: Colors.dark.accent }} />
                <span>Instant rewards</span>
              </div>
            </div>
          </div>

          {/* Right side - Stats/Preview */}
          <div className="flex-1 lg:max-w-md">
            <div
              className="rounded-3xl border p-6 lg:p-8"
              style={{
                backgroundColor: Colors.dark.card,
                borderColor: Colors.dark.border,
              }}
            >
              <div className="text-center mb-6">
                <div className="text-sm font-medium mb-2" style={{ color: Colors.dark.textMuted }}>
                  TODAY'S QUESTION
                </div>
                <div
                  className="text-xl font-semibold"
                  style={{ color: Colors.dark.text }}
                >
                  What will Bitcoin hit first?
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {['$120,000', '$80,000', '$150,000', 'Stays between'].map((option, i) => (
                  <div
                    key={option}
                    className="flex items-center gap-3 p-4 rounded-xl border"
                    style={{
                      backgroundColor: Colors.dark.surface,
                      borderColor: Colors.dark.border,
                    }}
                  >
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                      style={{ backgroundColor: Colors.dark.accent, color: '#000' }}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span style={{ color: Colors.dark.text }}>{option}</span>
                  </div>
                ))}
              </div>

              <div
                className="text-center text-sm"
                style={{ color: Colors.dark.textMuted }}
              >
                Results in 23h 45m
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div
        className={cn(
          'border-y transition-all duration-700 delay-200',
          contentVisible ? 'opacity-100' : 'opacity-0'
        )}
        style={{ borderColor: Colors.dark.border }}
      >
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="grid grid-cols-3 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div
                  className="text-2xl lg:text-3xl font-bold mb-1"
                  style={{ color: Colors.dark.accent }}
                >
                  {stat.value}
                </div>
                <div className="text-sm" style={{ color: Colors.dark.textMuted }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div
        className={cn(
          'py-16 transition-all duration-700 delay-300',
          contentVisible ? 'opacity-100' : 'opacity-0'
        )}
      >
        <div className="max-w-5xl mx-auto px-6">
          <h2
            className="text-2xl lg:text-3xl font-bold text-center mb-12"
            style={{ color: Colors.dark.text }}
          >
            Why Play Pally Predict?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="p-6 rounded-2xl border"
                  style={{
                    backgroundColor: Colors.dark.card,
                    borderColor: Colors.dark.border,
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: Colors.dark.surface }}
                  >
                    <Icon size={24} style={{ color: Colors.dark.accent }} />
                  </div>
                  <h3
                    className="text-lg font-semibold mb-2"
                    style={{ color: Colors.dark.text }}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-sm" style={{ color: Colors.dark.textMuted }}>
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div
        className={cn(
          'py-16 transition-all duration-700 delay-400',
          contentVisible ? 'opacity-100' : 'opacity-0'
        )}
        style={{ backgroundColor: Colors.dark.card }}
      >
        <div className="max-w-5xl mx-auto px-6">
          <h2
            className="text-2xl lg:text-3xl font-bold text-center mb-12"
            style={{ color: Colors.dark.text }}
          >
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: Colors.dark.accent }}
                >
                  <span
                    className="text-lg font-bold"
                    style={{
                      color: '#000',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                  >
                    {step.number}
                  </span>
                </div>
                <h3
                  className="font-semibold mb-2"
                  style={{ color: Colors.dark.text }}
                >
                  {step.title}
                </h3>
                <p className="text-sm" style={{ color: Colors.dark.textMuted }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/how-it-works">
              <a
                className="inline-flex items-center gap-2 text-sm font-medium"
                style={{ color: Colors.dark.accent }}
              >
                Learn more about rules & rewards
                <ChevronRight size={16} />
              </a>
            </Link>
          </div>
        </div>
      </div>

      {/* Social Proof / Testimonials placeholder */}
      <div
        className={cn(
          'py-16 transition-all duration-700 delay-500',
          contentVisible ? 'opacity-100' : 'opacity-0'
        )}
      >
        <div className="max-w-5xl mx-auto px-6">
          <h2
            className="text-2xl lg:text-3xl font-bold text-center mb-4"
            style={{ color: Colors.dark.text }}
          >
            Join the Community
          </h2>
          <p
            className="text-center text-lg mb-10"
            style={{ color: Colors.dark.textSecondary }}
          >
            Thousands of players compete daily. Will you be next?
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="https://twitter.com/PallyPredict"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-80 border"
              style={{
                borderColor: Colors.dark.border,
                color: Colors.dark.text,
              }}
            >
              Follow on X
            </a>
            <a
              href="https://t.me/PallyPredict_Bot"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-80 border"
              style={{
                borderColor: Colors.dark.border,
                color: Colors.dark.text,
              }}
            >
              Join Telegram
            </a>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div
        className={cn(
          'py-16 transition-all duration-700 delay-600',
          contentVisible ? 'opacity-100' : 'opacity-0'
        )}
        style={{ backgroundColor: Colors.dark.card }}
      >
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2
            className="text-2xl lg:text-3xl font-bold mb-4"
            style={{ color: Colors.dark.text }}
          >
            Think you know what others will pick?
          </h2>
          <p
            className="text-lg mb-8"
            style={{ color: Colors.dark.textSecondary }}
          >
            Join thousands playing the daily consensus game. Sign up free with Twitter.
          </p>
          <button
            onClick={handleStartPlaying}
            className={cn(
              'inline-flex items-center justify-center gap-3 py-4 px-10 rounded-xl transition-all',
              'active:scale-[0.98] hover:opacity-90'
            )}
            style={{ backgroundColor: Colors.dark.accent }}
          >
            <span className="text-lg font-bold" style={{ color: '#000' }}>
              {authenticated ? 'Go to Game' : 'Start Playing Free'}
            </span>
            <ArrowRight size={20} color="#000" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div
        className={cn(
          'py-8 border-t transition-all duration-700 delay-700',
          contentVisible ? 'opacity-100' : 'opacity-0'
        )}
        style={{ borderColor: Colors.dark.border }}
      >
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Logo size="sm" />
              <span className="font-semibold text-foreground">
                Pally Predict
              </span>
            </div>
            <div className="flex items-center gap-8 text-sm">
              <Link href="/how-it-works">
                <a style={{ color: Colors.dark.textMuted }} className="hover:opacity-80">
                  How It Works
                </a>
              </Link>
              <Link href="/about">
                <a style={{ color: Colors.dark.textMuted }} className="hover:opacity-80">
                  About
                </a>
              </Link>
              <Link href="/faq">
                <a style={{ color: Colors.dark.textMuted }} className="hover:opacity-80">
                  FAQ
                </a>
              </Link>
              <Link href="/terms">
                <a style={{ color: Colors.dark.textMuted }} className="hover:opacity-80">
                  Terms
                </a>
              </Link>
              <Link href="/privacy">
                <a style={{ color: Colors.dark.textMuted }} className="hover:opacity-80">
                  Privacy
                </a>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
