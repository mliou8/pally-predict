import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Target, Shield, Zap, Users, Globe, Heart } from 'lucide-react';
import Colors from '@/constants/colors';
import { cn } from '@/lib/utils';

export default function About() {
  const [contentVisible, setContentVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setContentVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const values = [
    {
      icon: Target,
      title: 'Fair Play',
      description: 'Everyone sees randomized option orders to prevent coordination. No insider advantages.',
    },
    {
      icon: Shield,
      title: 'Transparent',
      description: 'All results are calculated on-chain. Every vote and payout is verifiable.',
    },
    {
      icon: Zap,
      title: 'Instant Rewards',
      description: 'Winnings are distributed automatically when results are revealed. No waiting.',
    },
    {
      icon: Users,
      title: 'Community First',
      description: 'Built by predictors, for predictors. Your feedback shapes the game.',
    },
  ];

  const stats = [
    { label: 'Daily Players', value: '1,000+' },
    { label: 'Predictions Made', value: '50,000+' },
    { label: 'Total Rewarded', value: '$10,000+' },
  ];

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: Colors.dark.background }}>
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Back button */}
        <Link href="/">
          <a className="inline-flex items-center gap-2 mb-8 text-sm" style={{ color: Colors.dark.textMuted }}>
            <ArrowLeft size={16} />
            Back to home
          </a>
        </Link>

        {/* Header */}
        <div
          className={cn(
            'mb-12 transition-all duration-500',
            contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          <h1 className="text-3xl font-bold mb-4" style={{ color: Colors.dark.text }}>
            About Pally Predict
          </h1>
          <p className="text-lg" style={{ color: Colors.dark.textSecondary }}>
            The daily consensus game that rewards you for thinking like the crowd.
          </p>
        </div>

        {/* Mission */}
        <div
          className={cn(
            'mb-12 p-6 rounded-2xl border transition-all duration-500 delay-100',
            contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
          style={{
            backgroundColor: Colors.dark.card,
            borderColor: Colors.dark.border,
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Globe size={24} style={{ color: Colors.dark.accent }} />
            <h2 className="text-xl font-semibold" style={{ color: Colors.dark.text }}>
              Our Mission
            </h2>
          </div>
          <p className="text-base leading-relaxed" style={{ color: Colors.dark.textSecondary }}>
            Pally Predict turns collective intelligence into a game. Every day, thousands of players
            answer the same question, and those who best predict the consensus are rewarded.
            It's not about being right - it's about understanding how others think.
          </p>
          <p className="text-base leading-relaxed mt-4" style={{ color: Colors.dark.textSecondary }}>
            We believe prediction games should be fair, fun, and rewarding. That's why we've built
            anti-collusion measures, transparent reward calculations, and a community-driven approach
            to question selection.
          </p>
        </div>

        {/* Stats */}
        <div
          className={cn(
            'mb-12 transition-all duration-500 delay-150',
            contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          <div className="grid grid-cols-3 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="p-5 rounded-2xl border text-center"
                style={{
                  backgroundColor: Colors.dark.card,
                  borderColor: Colors.dark.border,
                }}
              >
                <div
                  className="text-2xl font-bold mb-1"
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

        {/* Values */}
        <div
          className={cn(
            'mb-12 transition-all duration-500 delay-200',
            contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          <h2 className="text-xl font-semibold mb-6" style={{ color: Colors.dark.text }}>
            What We Stand For
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <div
                  key={value.title}
                  className="p-5 rounded-2xl border"
                  style={{
                    backgroundColor: Colors.dark.card,
                    borderColor: Colors.dark.border,
                  }}
                >
                  <Icon size={24} className="mb-3" style={{ color: Colors.dark.accent }} />
                  <h3 className="font-semibold mb-2" style={{ color: Colors.dark.text }}>
                    {value.title}
                  </h3>
                  <p className="text-sm" style={{ color: Colors.dark.textMuted }}>
                    {value.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* How We're Different */}
        <div
          className={cn(
            'mb-12 transition-all duration-500 delay-250',
            contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          <h2 className="text-xl font-semibold mb-6" style={{ color: Colors.dark.text }}>
            How We're Different
          </h2>
          <div
            className="p-6 rounded-2xl border space-y-4"
            style={{
              backgroundColor: Colors.dark.card,
              borderColor: Colors.dark.border,
            }}
          >
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: Colors.dark.accent }} />
              <p style={{ color: Colors.dark.textSecondary }}>
                <strong style={{ color: Colors.dark.text }}>No complex odds</strong> - Simple A/B/C/D choices.
                Pick what you think most people will pick.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: Colors.dark.accent }} />
              <p style={{ color: Colors.dark.textSecondary }}>
                <strong style={{ color: Colors.dark.text }}>Daily ritual</strong> - One question per day keeps
                it fun without being overwhelming.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: Colors.dark.accent }} />
              <p style={{ color: Colors.dark.textSecondary }}>
                <strong style={{ color: Colors.dark.text }}>Real stakes</strong> - Your predictions matter.
                Build your reputation and earn real rewards.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: Colors.dark.accent }} />
              <p style={{ color: Colors.dark.textSecondary }}>
                <strong style={{ color: Colors.dark.text }}>Anti-cheating measures</strong> - Randomized options,
                rate limiting, and Twitter verification prevent gaming the system.
              </p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div
          className={cn(
            'mb-12 p-6 rounded-2xl border transition-all duration-500 delay-300',
            contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
          style={{
            backgroundColor: Colors.dark.card,
            borderColor: Colors.dark.border,
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Heart size={24} style={{ color: Colors.dark.accent }} />
            <h2 className="text-xl font-semibold" style={{ color: Colors.dark.text }}>
              Get In Touch
            </h2>
          </div>
          <p className="text-base mb-4" style={{ color: Colors.dark.textSecondary }}>
            We love hearing from our community. Have feedback, questions, or just want to say hi?
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="https://twitter.com/PallyPredict"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
              style={{ backgroundColor: Colors.dark.surface, color: Colors.dark.text }}
            >
              Twitter/X
            </a>
            <a
              href="https://t.me/PallyPredict_Bot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
              style={{ backgroundColor: Colors.dark.surface, color: Colors.dark.text }}
            >
              Telegram
            </a>
            <a
              href="mailto:hello@pallypredict.com"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
              style={{ backgroundColor: Colors.dark.surface, color: Colors.dark.text }}
            >
              Email Us
            </a>
          </div>
        </div>

        {/* CTA */}
        <div
          className={cn(
            'text-center transition-all duration-500 delay-400',
            contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          <Link href="/play">
            <a
              className="inline-flex items-center justify-center gap-2 py-4 px-8 rounded-xl font-bold transition-all active:scale-[0.98]"
              style={{ backgroundColor: Colors.dark.accent, color: '#000' }}
            >
              Start Playing
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}
