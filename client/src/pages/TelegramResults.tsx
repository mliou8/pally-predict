import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Share2, Sparkles, TrendingDown, ChevronRight, Zap, TrendingUp } from 'lucide-react';
import Colors from '@/constants/colors';
import { cn } from '@/lib/utils';
import ResultBar from '@/components/game/ResultBar';
import ConfettiEffect from '@/components/game/ConfettiEffect';
import { useTelegram } from '@/contexts/TelegramContext';
import type { Question, VoteChoice } from '@shared/schema';

interface TelegramBet {
  id: string;
  questionId: string;
  choice: VoteChoice;
  betAmount: string;
  isCorrect: boolean | null;
  payout: string | null;
}

interface QuestionStats {
  totalBets: number;
  totalAmount: string;
  votesA: number;
  votesB: number;
  votesC: number;
  votesD: number;
  amountA: string;
  amountB: string;
  amountC: string;
  amountD: string;
}

export default function TelegramResults() {
  const { initData, haptic, showBackButton, hideBackButton } = useTelegram();
  const [, setLocation] = useLocation();
  const [showConfetti, setShowConfetti] = useState(false);

  // Animation states
  const [titleVisible, setTitleVisible] = useState(false);
  const [resultVisible, setResultVisible] = useState(false);
  const [actionVisible, setActionVisible] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setTitleVisible(true), 100);
    const t2 = setTimeout(() => setResultVisible(true), 450);
    const t3 = setTimeout(() => setActionVisible(true), 800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // Setup back button
  useEffect(() => {
    showBackButton(() => setLocation('/'));
    return () => hideBackButton();
  }, [showBackButton, hideBackButton, setLocation]);

  // Fetch the latest revealed question
  const { data: question } = useQuery<Question | null>({
    queryKey: ['/api/telegram/question/revealed'],
    queryFn: async () => {
      const response = await fetch('/api/telegram/question/revealed', {
        headers: { 'X-Telegram-Init-Data': initData },
      });
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!initData,
  });

  // Fetch user's bet for this question
  const { data: userBet } = useQuery<TelegramBet | null>({
    queryKey: ['/api/telegram/bet', question?.id],
    queryFn: async () => {
      const response = await fetch(`/api/telegram/bet/${question!.id}`, {
        headers: { 'X-Telegram-Init-Data': initData },
      });
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!initData && !!question,
  });

  // Fetch question stats
  const { data: stats } = useQuery<QuestionStats>({
    queryKey: ['/api/telegram/question/stats', question?.id],
    queryFn: async () => {
      const response = await fetch(`/api/telegram/question/${question!.id}/stats`, {
        headers: { 'X-Telegram-Init-Data': initData },
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    enabled: !!initData && !!question,
  });

  // Show confetti for wins
  useEffect(() => {
    if (userBet?.isCorrect) {
      const timer = setTimeout(() => {
        setShowConfetti(true);
        haptic('success');
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [userBet?.isCorrect, haptic]);

  const handleShare = async () => {
    if (!question || !stats) return;

    const userPct = userBet
      ? Math.round((getVotesForChoice(userBet.choice) / stats.totalBets) * 100)
      : 0;

    const message = userBet?.isCorrect
      ? `I picked ${getOptionText(userBet.choice)} with ${userPct}% of players on Pally Family Feud!`
      : `I missed the crowd on Pally Family Feud today. Check it out!`;

    if (navigator.share) {
      try {
        await navigator.share({ text: message });
      } catch (e) {
        console.log('[Results] Share cancelled');
      }
    }
  };

  const handleDone = () => {
    setLocation('/');
  };

  const getVotesForChoice = (choice: VoteChoice): number => {
    if (!stats) return 0;
    switch (choice) {
      case 'A': return stats.votesA;
      case 'B': return stats.votesB;
      case 'C': return stats.votesC;
      case 'D': return stats.votesD;
      default: return 0;
    }
  };

  const getOptionText = (choice: VoteChoice): string => {
    if (!question) return '';
    switch (choice) {
      case 'A': return question.optionA;
      case 'B': return question.optionB;
      case 'C': return question.optionC || '';
      case 'D': return question.optionD || '';
      default: return '';
    }
  };

  // No results yet
  if (!question || !stats) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5" style={{ backgroundColor: Colors.dark.background }}>
        <div className="text-5xl mb-4">🎲</div>
        <h2 className="text-xl font-bold mb-2" style={{ color: Colors.dark.text }}>
          No results yet
        </h2>
        <p className="text-sm mb-6" style={{ color: Colors.dark.textMuted }}>
          Play today's round to see results
        </p>
        <button
          onClick={handleDone}
          className="px-6 py-3 rounded-xl font-semibold transition-all hover:opacity-90"
          style={{ backgroundColor: Colors.dark.surface, color: Colors.dark.text }}
        >
          Go to Play
        </button>
      </div>
    );
  }

  // Build distribution data
  const options = [
    { id: 'A' as VoteChoice, text: question.optionA },
    { id: 'B' as VoteChoice, text: question.optionB },
    ...(question.optionC ? [{ id: 'C' as VoteChoice, text: question.optionC }] : []),
    ...(question.optionD ? [{ id: 'D' as VoteChoice, text: question.optionD }] : []),
  ];

  const distribution = options.map((opt) => {
    const votes = getVotesForChoice(opt.id);
    return {
      optionId: opt.id,
      percentage: stats.totalBets > 0 ? Math.round((votes / stats.totalBets) * 100) : 0,
      count: votes,
    };
  });

  const winningDist = distribution.reduce((a, b) => a.percentage > b.percentage ? a : b);
  const winningOption = options.find((o) => o.id === winningDist.optionId);
  const userOption = userBet ? options.find((o) => o.id === userBet.choice) : null;
  const userWon = userBet?.isCorrect || false;
  const wagerAmount = userBet ? parseFloat(userBet.betAmount) : 0;
  const payoutAmount = userBet?.payout ? parseFloat(userBet.payout) : 0;
  const multiplier = wagerAmount > 0 && payoutAmount > 0 ? (payoutAmount / wagerAmount).toFixed(2) : '0';

  return (
    <div className="min-h-screen" style={{ backgroundColor: Colors.dark.background }}>
      <ConfettiEffect active={showConfetti} />

      <div className="max-w-lg mx-auto px-5 pt-8 pb-10">
        {/* Outcome Area */}
        <div
          className={cn(
            'flex flex-col items-center mb-[22px] transition-all duration-450',
            titleVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95'
          )}
        >
          {userWon ? (
            <>
              <div
                className="w-16 h-16 rounded-[20px] flex items-center justify-center border-[1.5px] mb-4"
                style={{
                  backgroundColor: Colors.dark.accentDim,
                  borderColor: Colors.dark.accentGlow,
                  boxShadow: `0 0 16px ${Colors.dark.accent}4D`,
                }}
              >
                <Sparkles size={26} color={Colors.dark.accent} />
              </div>
              <h1 className="text-[28px] font-extrabold text-center mb-[7px] tracking-tight" style={{ color: Colors.dark.text }}>
                You nailed it!
              </h1>
              <p className="text-sm text-center leading-[21px] px-2.5" style={{ color: Colors.dark.textSecondary }}>
                You picked <span className="font-bold" style={{ color: Colors.dark.accent }}>{userOption?.text}</span> with the majority
              </p>
            </>
          ) : (
            <>
              <div
                className="w-16 h-16 rounded-[20px] flex items-center justify-center border-[1.5px] mb-4"
                style={{
                  backgroundColor: Colors.dark.errorDim,
                  borderColor: 'rgba(239, 68, 68, 0.22)',
                }}
              >
                <TrendingDown size={24} color={Colors.dark.error} />
              </div>
              <h1 className="text-[28px] font-extrabold text-center mb-[7px] tracking-tight" style={{ color: Colors.dark.text }}>
                Not this time
              </h1>
              <p className="text-sm text-center leading-[21px] px-2.5" style={{ color: Colors.dark.textSecondary }}>
                The crowd went with <span className="font-bold" style={{ color: Colors.dark.error }}>{winningOption?.text}</span>
              </p>
            </>
          )}
        </div>

        {/* Wager Summary */}
        {userBet && (
          <div
            className={cn(
              'rounded-2xl p-4 border mb-3.5 transition-all duration-350',
              resultVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            )}
            style={{ backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border }}
          >
            <div className="flex items-center">
              <div className="flex-1 flex flex-col items-center gap-[5px]">
                <Zap size={12} color={Colors.dark.warning} />
                <span className="text-[10px] font-semibold tracking-[0.3px]" style={{ color: Colors.dark.textMuted }}>
                  Wagered
                </span>
                <span className="text-xl font-black tabular-nums" style={{ color: Colors.dark.warning }}>
                  ${wagerAmount.toFixed(0)}
                </span>
              </div>

              <div className="w-px h-9" style={{ backgroundColor: Colors.dark.border }} />

              <div className="flex-1 flex flex-col items-center gap-[5px]">
                <TrendingUp size={12} color={Colors.dark.blue} />
                <span className="text-[10px] font-semibold tracking-[0.3px]" style={{ color: Colors.dark.textMuted }}>
                  Multiplier
                </span>
                <span className="text-xl font-black tabular-nums" style={{ color: Colors.dark.blue }}>
                  {parseFloat(multiplier) > 0 ? `${multiplier}x` : '—'}
                </span>
              </div>

              <div className="w-px h-9" style={{ backgroundColor: Colors.dark.border }} />

              <div className="flex-1 flex flex-col items-center gap-[5px]">
                <Sparkles size={12} color={userWon ? Colors.dark.success : Colors.dark.error} />
                <span className="text-[10px] font-semibold tracking-[0.3px]" style={{ color: Colors.dark.textMuted }}>
                  Return
                </span>
                <span
                  className="text-xl font-black tabular-nums"
                  style={{ color: userWon ? Colors.dark.success : Colors.dark.error }}
                >
                  {userWon ? `+$${payoutAmount.toFixed(0)}` : `-$${wagerAmount.toFixed(0)}`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Question Summary */}
        <div
          className={cn(
            'rounded-[14px] p-4 border mb-[22px] transition-all duration-350',
            resultVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          )}
          style={{ backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border }}
        >
          <div className="flex justify-between items-center mb-2.5">
            <div
              className="px-[9px] py-[3px] rounded-md border"
              style={{ backgroundColor: Colors.dark.accentDim, borderColor: Colors.dark.accentGlow }}
            >
              <span
                className="text-[9px] font-extrabold uppercase tracking-[1px]"
                style={{ color: Colors.dark.accent }}
              >
                {question.type || 'PREDICTION'}
              </span>
            </div>
            <span className="text-[11px] tabular-nums font-medium" style={{ color: Colors.dark.textMuted }}>
              {stats.totalBets.toLocaleString()} votes
            </span>
          </div>
          <p className="text-[17px] font-bold leading-6" style={{ color: Colors.dark.text }}>
            {question.prompt}
          </p>
        </div>

        {/* Distribution Header */}
        <div className="flex items-center gap-[7px] mb-3">
          <div className="w-1 h-1 rounded-full" style={{ backgroundColor: Colors.dark.accent }} />
          <span
            className="text-[10px] font-bold tracking-[1.5px]"
            style={{ color: Colors.dark.textMuted }}
          >
            VOTE BREAKDOWN
          </span>
        </div>

        {/* Result Bars */}
        <div className="mb-[22px]">
          {distribution
            .sort((a, b) => b.percentage - a.percentage)
            .map((dist, i) => {
              const option = options.find((o) => o.id === dist.optionId);
              const originalIndex = options.findIndex((o) => o.id === dist.optionId);
              return (
                <ResultBar
                  key={dist.optionId}
                  text={option?.text ?? ''}
                  percentage={dist.percentage}
                  count={dist.count}
                  index={originalIndex}
                  isWinner={dist.optionId === winningDist.optionId}
                  isUserPick={dist.optionId === userBet?.choice}
                  delay={i * 180 + 350}
                />
              );
            })}
        </div>

        {/* Actions */}
        <div
          className={cn(
            'flex gap-2.5 transition-all duration-280',
            actionVisible ? 'opacity-100' : 'opacity-0'
          )}
        >
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-[7px] py-[15px] rounded-[14px] border transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              backgroundColor: Colors.dark.accentDim,
              borderColor: Colors.dark.accentGlow,
            }}
          >
            <Share2 size={14} color={Colors.dark.accent} />
            <span className="text-sm font-bold" style={{ color: Colors.dark.accent }}>
              Share
            </span>
          </button>

          <button
            onClick={handleDone}
            className="flex-1 flex items-center justify-center gap-[5px] py-[15px] rounded-[14px] border transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              backgroundColor: Colors.dark.surface,
              borderColor: Colors.dark.border,
            }}
          >
            <span className="text-sm font-bold" style={{ color: Colors.dark.text }}>
              Done
            </span>
            <ChevronRight size={14} color={Colors.dark.text} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
