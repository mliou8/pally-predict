import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePrivy } from '@privy-io/react-auth';
import { useLocation } from 'wouter';
import { Share2, Sparkles, X, TrendingDown, ChevronRight, Zap, TrendingUp } from 'lucide-react';
import Colors from '@/constants/colors';
import { cn } from '@/lib/utils';
import ResultBar from '@/components/game/ResultBar';
import ConfettiEffect from '@/components/game/ConfettiEffect';
import type { Question, Vote, QuestionResults as QuestionResultsType, VoteChoice } from '@shared/schema';

interface VoteDistribution {
  optionId: string;
  percentage: number;
  count: number;
}

export default function Results() {
  const { user } = usePrivy();
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

  // Fetch revealed questions
  const { data: revealedQuestions = [] } = useQuery<Question[]>({
    queryKey: ['/api/questions/revealed'],
  });

  // User votes
  const { data: userVotes = [] } = useQuery<Vote[]>({
    queryKey: ['/api/votes/mine'],
    enabled: !!user,
  });

  // Get the most recent question with results
  const question = revealedQuestions[0];
  const userVote = question ? userVotes.find((v) => v.questionId === question.id) : null;

  // Fetch results for the question
  const { data: apiResults, isLoading: isLoadingResults } = useQuery<QuestionResultsType>({
    queryKey: ['/api/results', question?.id],
    queryFn: async () => {
      const response = await fetch(`/api/results/${question!.id}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!question,
  });

  // Build result object from real API data
  const result = useMemo(() => {
    if (!question || !apiResults) return null;

    const options = [
      { id: 'A', text: question.optionA },
      { id: 'B', text: question.optionB },
      ...(question.optionC ? [{ id: 'C', text: question.optionC }] : []),
      ...(question.optionD ? [{ id: 'D', text: question.optionD }] : []),
    ];

    const distribution: VoteDistribution[] = [
      { optionId: 'A', percentage: apiResults.percentA, count: apiResults.votesA },
      { optionId: 'B', percentage: apiResults.percentB, count: apiResults.votesB },
      ...(question.optionC ? [{ optionId: 'C', percentage: apiResults.percentC || 0, count: apiResults.votesC || 0 }] : []),
      ...(question.optionD ? [{ optionId: 'D', percentage: apiResults.percentD || 0, count: apiResults.votesD || 0 }] : []),
    ];

    const winningDist = distribution.reduce((a, b) => a.percentage > b.percentage ? a : b);
    const userWon = userVote?.choice === winningDist.optionId;

    const userPct = distribution.find(d => d.optionId === userVote?.choice)?.percentage ?? 0;
    const multiplier = userWon && userPct > 0 ? parseFloat((100 / userPct).toFixed(2)) : 0;

    // Use actual bet amount from user's vote
    const wagerAmount = userVote?.betAmount ? parseFloat(userVote.betAmount) : 100;
    const payoutPoints = userVote?.payout ? parseFloat(userVote.payout) : (userWon ? Math.floor(wagerAmount * multiplier) : 0);

    return {
      question,
      options,
      distribution,
      winningOptionId: winningDist.optionId,
      userOptionId: userVote?.choice || null,
      userWon,
      totalVotes: apiResults.totalVotes,
      wagerAmount,
      payoutPoints,
      multiplier,
    };
  }, [question, apiResults, userVote]);

  // Show confetti for wins
  useEffect(() => {
    if (result?.userWon) {
      const timer = setTimeout(() => setShowConfetti(true), 800);
      return () => clearTimeout(timer);
    }
  }, [result?.userWon]);

  const handleShare = async () => {
    if (!result) return;
    const winningOption = result.options.find(o => o.id === result.winningOptionId);
    const userOption = result.options.find(o => o.id === result.userOptionId);
    const userPct = result.distribution.find(d => d.optionId === result.userOptionId)?.percentage ?? 0;

    const message = result.userWon
      ? `I picked ${userOption?.text} with ${userPct}% of players on Pally Predict!`
      : `I missed the crowd on Pally Predict today. ${winningOption?.text} won with the majority vote!`;

    try {
      if (navigator.share) {
        await navigator.share({ text: message });
      } else {
        await navigator.clipboard.writeText(message);
      }
    } catch (e) {
      console.log('[Results] Share cancelled');
    }
  };

  const handleDone = () => {
    setLocation('/');
  };

  // Loading state
  if (isLoadingResults && question) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5" style={{ backgroundColor: Colors.dark.background }}>
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin mb-4"
          style={{ borderColor: Colors.dark.accent, borderTopColor: 'transparent' }}
        />
        <p className="text-sm" style={{ color: Colors.dark.textMuted }}>
          Loading results...
        </p>
      </div>
    );
  }

  // No results yet
  if (!result) {
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
          style={{ backgroundColor: Colors.dark.surface, color: Colors.dark.text, borderColor: Colors.dark.border }}
        >
          Go to Play
        </button>
      </div>
    );
  }

  const winningOption = result.options.find(o => o.id === result.winningOptionId);
  const userOption = result.options.find(o => o.id === result.userOptionId);

  return (
    <div className="min-h-screen" style={{ backgroundColor: Colors.dark.background }}>
      <ConfettiEffect active={showConfetti} />

      {/* Close Button */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={handleDone}
          className="w-9 h-9 rounded-[11px] flex items-center justify-center border transition-all hover:opacity-80"
          style={{ backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border }}
        >
          <X size={16} color={Colors.dark.textSecondary} strokeWidth={2.5} />
        </button>
      </div>

      <div className="max-w-lg mx-auto px-5 pt-16 pb-10">
        {/* Outcome Area */}
        <div
          className={cn(
            'flex flex-col items-center mb-[22px] transition-all duration-450',
            titleVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95'
          )}
        >
          {result.userWon ? (
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
                {(result.wagerAmount ?? 0).toLocaleString()}
              </span>
            </div>

            <div className="w-px h-9" style={{ backgroundColor: Colors.dark.border }} />

            <div className="flex-1 flex flex-col items-center gap-[5px]">
              <TrendingUp size={12} color={Colors.dark.blue} />
              <span className="text-[10px] font-semibold tracking-[0.3px]" style={{ color: Colors.dark.textMuted }}>
                Multiplier
              </span>
              <span className="text-xl font-black tabular-nums" style={{ color: Colors.dark.blue }}>
                {result.multiplier > 0 ? `${result.multiplier}x` : '—'}
              </span>
            </div>

            <div className="w-px h-9" style={{ backgroundColor: Colors.dark.border }} />

            <div className="flex-1 flex flex-col items-center gap-[5px]">
              <Sparkles size={12} color={result.userWon ? Colors.dark.success : Colors.dark.error} />
              <span className="text-[10px] font-semibold tracking-[0.3px]" style={{ color: Colors.dark.textMuted }}>
                Return
              </span>
              <span
                className="text-xl font-black tabular-nums"
                style={{ color: result.userWon ? Colors.dark.success : Colors.dark.error }}
              >
                {result.userWon ? `+${(result.payoutPoints ?? 0).toLocaleString()}` : `-${(result.wagerAmount ?? 0).toLocaleString()}`}
              </span>
            </div>
          </div>

          {result.userWon && (
            <div
              className="flex justify-between items-center mt-3 pt-3 border-t"
              style={{ borderColor: Colors.dark.border }}
            >
              <span className="text-xs font-semibold" style={{ color: Colors.dark.textSecondary }}>
                Net profit
              </span>
              <span className="text-base font-black tabular-nums" style={{ color: Colors.dark.success }}>
                +{(result.payoutPoints - result.wagerAmount).toLocaleString()} pts
              </span>
            </div>
          )}
        </div>

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
                {question?.type || 'PREDICTION'}
              </span>
            </div>
            <span className="text-[11px] tabular-nums font-medium" style={{ color: Colors.dark.textMuted }}>
              {(result.totalVotes ?? 0).toLocaleString()} votes
            </span>
          </div>
          <p className="text-[17px] font-bold leading-6" style={{ color: Colors.dark.text }}>
            {question?.prompt}
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
          {result.distribution
            .sort((a, b) => b.percentage - a.percentage)
            .map((dist, i) => {
              const option = result.options.find(o => o.id === dist.optionId);
              const originalIndex = result.options.findIndex(o => o.id === dist.optionId);
              return (
                <ResultBar
                  key={dist.optionId}
                  text={option?.text ?? ''}
                  percentage={dist.percentage}
                  count={dist.count}
                  index={originalIndex}
                  isWinner={dist.optionId === result.winningOptionId}
                  isUserPick={dist.optionId === result.userOptionId}
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
