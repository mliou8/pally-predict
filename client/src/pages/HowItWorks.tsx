import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Clock, Users, Trophy, Coins, CheckCircle, TrendingUp, Share2 } from 'lucide-react';
import Colors from '@/constants/colors';
import { cn } from '@/lib/utils';

export default function HowItWorks() {
  const [contentVisible, setContentVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setContentVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const steps = [
    {
      number: '01',
      icon: Clock,
      title: 'New Question Daily',
      description: 'Every day at noon ET, a new prediction question drops. Topics range from crypto and tech to markets and culture.',
    },
    {
      number: '02',
      icon: Users,
      title: 'Predict the Consensus',
      description: 'Your goal is to predict what the majority will pick. Think like the crowd to maximize your rewards.',
    },
    {
      number: '03',
      icon: CheckCircle,
      title: 'Lock In Your Answer',
      description: 'Choose A, B, C, or D and confirm your prediction. You have 24 hours before results are revealed.',
    },
    {
      number: '04',
      icon: Trophy,
      title: 'Results & Rewards',
      description: 'At noon the next day, see how you did. Winners who picked the majority answer share the pot.',
    },
  ];

  const rewards = [
    { place: '1st Place', points: '100 pts', payout: 'Share of pot', color: 'text-yellow-500' },
    { place: '2nd Place', points: '75 pts', payout: '25% back', color: 'text-gray-400' },
    { place: '3rd Place', points: '50 pts', payout: '15% back', color: 'text-orange-500' },
    { place: '4th Place', points: '25 pts', payout: '10% back', color: 'text-slate-400' },
  ];

  const bonuses = [
    {
      icon: Share2,
      title: 'Public Vote Bonus',
      description: 'Share your prediction publicly to earn 2x points on that vote.',
    },
    {
      icon: TrendingUp,
      title: 'Streak Rewards',
      description: 'Build a winning streak for bonus multipliers on your earnings.',
    },
    {
      icon: Trophy,
      title: 'Season Rankings',
      description: 'Weekly leaderboard resets with special rewards for top performers.',
    },
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
            How It Works
          </h1>
          <p className="text-lg" style={{ color: Colors.dark.textSecondary }}>
            Pally Predict is a daily consensus game. Predict what the majority will choose and climb the leaderboard.
          </p>
        </div>

        {/* Steps */}
        <div
          className={cn(
            'mb-16 transition-all duration-500 delay-100',
            contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          <h2 className="text-xl font-semibold mb-6" style={{ color: Colors.dark.text }}>
            The Game Loop
          </h2>
          <div className="space-y-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.number}
                  className="flex gap-4 p-5 rounded-2xl border"
                  style={{
                    backgroundColor: Colors.dark.card,
                    borderColor: Colors.dark.border,
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: Colors.dark.surface }}
                  >
                    <Icon size={24} style={{ color: Colors.dark.accent }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className="text-xs font-mono font-bold px-2 py-1 rounded"
                        style={{ backgroundColor: Colors.dark.accent, color: '#000' }}
                      >
                        {step.number}
                      </span>
                      <h3 className="font-semibold" style={{ color: Colors.dark.text }}>
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-sm" style={{ color: Colors.dark.textMuted }}>
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rewards */}
        <div
          className={cn(
            'mb-16 transition-all duration-500 delay-200',
            contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          <h2 className="text-xl font-semibold mb-6" style={{ color: Colors.dark.text }}>
            Reward Structure
          </h2>
          <div
            className="rounded-2xl border overflow-hidden"
            style={{
              backgroundColor: Colors.dark.card,
              borderColor: Colors.dark.border,
            }}
          >
            <div
              className="grid grid-cols-3 gap-4 p-4 border-b text-sm font-semibold"
              style={{ borderColor: Colors.dark.border, color: Colors.dark.textMuted }}
            >
              <div>Placement</div>
              <div>Alpha Points</div>
              <div>Payout</div>
            </div>
            {rewards.map((reward) => (
              <div
                key={reward.place}
                className="grid grid-cols-3 gap-4 p-4 border-b last:border-b-0"
                style={{ borderColor: Colors.dark.border }}
              >
                <div className={cn('font-semibold', reward.color)}>{reward.place}</div>
                <div style={{ color: Colors.dark.text }}>{reward.points}</div>
                <div style={{ color: Colors.dark.textSecondary }}>{reward.payout}</div>
              </div>
            ))}
          </div>
          <p className="text-sm mt-4" style={{ color: Colors.dark.textMuted }}>
            Everyone who participates earns 10 participation points, even if they don't place.
          </p>
        </div>

        {/* Bonuses */}
        <div
          className={cn(
            'mb-16 transition-all duration-500 delay-300',
            contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          <h2 className="text-xl font-semibold mb-6" style={{ color: Colors.dark.text }}>
            Bonus Multipliers
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {bonuses.map((bonus) => {
              const Icon = bonus.icon;
              return (
                <div
                  key={bonus.title}
                  className="p-5 rounded-2xl border"
                  style={{
                    backgroundColor: Colors.dark.card,
                    borderColor: Colors.dark.border,
                  }}
                >
                  <Icon size={24} className="mb-3" style={{ color: Colors.dark.accent }} />
                  <h3 className="font-semibold mb-2" style={{ color: Colors.dark.text }}>
                    {bonus.title}
                  </h3>
                  <p className="text-sm" style={{ color: Colors.dark.textMuted }}>
                    {bonus.description}
                  </p>
                </div>
              );
            })}
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
