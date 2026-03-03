import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Users, Flame, ChevronRight, Lock, Crosshair, BarChart3, Shuffle } from 'lucide-react';
import Colors from '@/constants/colors';
import { cn } from '@/lib/utils';
import AnswerCard from '@/components/game/AnswerCard';
import CountdownTimer from '@/components/game/CountdownTimer';
import WagerSelector from '@/components/game/WagerSelector';
import { useTelegram } from '@/contexts/TelegramContext';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import type { VoteChoice, Question } from '@shared/schema';
import type { PayoutMode } from '@/types/game';

interface TelegramUser {
  id: string;
  telegramId: string;
  username: string | null;
  firstName: string | null;
  balance: string;
  totalWagered: string;
  totalWon: string;
  totalPredictions: number;
  correctPredictions: number;
  currentStreak: number;
  maxStreak: number;
}

interface TelegramBet {
  id: string;
  questionId: string;
  choice: VoteChoice;
  betAmount: string;
}

const OPTION_LABELS: VoteChoice[] = ['A', 'B', 'C', 'D'];

export default function TelegramPlay() {
  const { user: telegramUser, initData, haptic, showMainButton, hideMainButton, setMainButtonLoading } = useTelegram();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Local game state
  const [selectedOptionId, setSelectedOptionId] = useState<VoteChoice | null>(null);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [wagerAmount, setWagerAmount] = useState(100);
  const [payoutMode, setPayoutMode] = useState<PayoutMode>('even_split');

  // Animations
  const [headerVisible, setHeaderVisible] = useState(false);
  const [questionVisible, setQuestionVisible] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setHeaderVisible(true), 100);
    const t2 = setTimeout(() => setQuestionVisible(true), 220);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Fetch Telegram user from our backend
  const { data: user, isLoading: isLoadingUser } = useQuery<TelegramUser>({
    queryKey: ['/api/telegram/user'],
    queryFn: async () => {
      const response = await fetch('/api/telegram/user', {
        headers: {
          'X-Telegram-Init-Data': initData,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    },
    enabled: !!initData,
  });

  // Fetch active question
  const { data: question, isLoading: isLoadingQuestion } = useQuery<Question>({
    queryKey: ['/api/telegram/question/active'],
    queryFn: async () => {
      const response = await fetch('/api/telegram/question/active', {
        headers: {
          'X-Telegram-Init-Data': initData,
        },
      });
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!initData,
  });

  // Check if user already voted
  const { data: existingBet } = useQuery<TelegramBet | null>({
    queryKey: ['/api/telegram/bet', question?.id],
    queryFn: async () => {
      const response = await fetch(`/api/telegram/bet/${question!.id}`, {
        headers: {
          'X-Telegram-Init-Data': initData,
        },
      });
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!initData && !!question,
  });

  // Set up existing bet state
  useEffect(() => {
    if (existingBet) {
      setSelectedOptionId(existingBet.choice);
      setHasConfirmed(true);
      setWagerAmount(parseFloat(existingBet.betAmount));
    }
  }, [existingBet]);

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async (data: { questionId: string; choice: VoteChoice; betAmount: number }) => {
      const response = await fetch('/api/telegram/bet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Init-Data': initData,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to place bet');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/telegram/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/telegram/bet'] });
      setHasConfirmed(true);
      hideMainButton();
      haptic('success');
      toast({
        title: 'Prediction locked in!',
        description: 'Your answer has been recorded.',
      });
    },
    onError: (error: Error) => {
      haptic('error');
      toast({
        title: 'Failed to submit',
        description: error.message,
        variant: 'destructive',
      });
      setMainButtonLoading(false);
    },
  });

  // Handle option selection
  const handleSelectOption = useCallback((index: number) => {
    if (hasConfirmed) return;
    haptic('selection');
    setSelectedOptionId(OPTION_LABELS[index]);
  }, [hasConfirmed, haptic]);

  // Handle confirm
  const handleConfirm = useCallback(() => {
    if (!selectedOptionId || hasConfirmed || !question) return;

    setMainButtonLoading(true);
    voteMutation.mutate({
      questionId: question.id,
      choice: selectedOptionId,
      betAmount: wagerAmount,
    });
  }, [selectedOptionId, hasConfirmed, question, wagerAmount, voteMutation, setMainButtonLoading]);

  // Setup main button when selection changes
  useEffect(() => {
    if (selectedOptionId && !hasConfirmed && question) {
      const option = getOptions().find((o) => o.id === selectedOptionId);
      showMainButton(`Lock in ${option?.text} · $${wagerAmount}`, handleConfirm);
    } else {
      hideMainButton();
    }

    return () => hideMainButton();
  }, [selectedOptionId, hasConfirmed, wagerAmount, question, showMainButton, hideMainButton, handleConfirm]);

  const handleViewResults = useCallback(() => {
    setLocation('/results');
  }, [setLocation]);

  const togglePayoutMode = useCallback(() => {
    setPayoutMode((prev) => (prev === 'even_split' ? 'multiplier_odds' : 'even_split'));
  }, []);

  // Get options from question
  const getOptions = () => {
    if (!question) return [];
    return [
      { id: 'A' as VoteChoice, text: question.optionA },
      { id: 'B' as VoteChoice, text: question.optionB },
      ...(question.optionC ? [{ id: 'C' as VoteChoice, text: question.optionC }] : []),
      ...(question.optionD ? [{ id: 'D' as VoteChoice, text: question.optionD }] : []),
    ];
  };

  const options = getOptions();
  const selectedOption = options.find((o) => o.id === selectedOptionId);
  const userBalance = user ? parseFloat(user.balance) : 500;
  const userStreak = user?.currentStreak || 0;

  // Loading state
  if (isLoadingUser || isLoadingQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: Colors.dark.background }}>
        <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: Colors.dark.accent, borderTopColor: 'transparent' }} />
      </div>
    );
  }

  // No question
  if (!question) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5" style={{ backgroundColor: Colors.dark.background }}>
        <div className="text-5xl mb-4">🎲</div>
        <h2 className="text-xl font-bold mb-2" style={{ color: Colors.dark.text }}>
          No questions today
        </h2>
        <p className="text-sm" style={{ color: Colors.dark.textMuted }}>
          Check back soon for new predictions!
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: Colors.dark.background }}>
      <div className="max-w-lg mx-auto px-5 py-6 pb-24">
        {/* Header */}
        <div
          className={cn(
            'flex justify-between items-center mb-8 transition-all duration-450',
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-[38px] h-[38px] rounded-xl flex items-center justify-center"
              style={{ backgroundColor: Colors.dark.accent }}
            >
              <span className="text-lg font-black text-white">P</span>
            </div>
            <div>
              <div className="text-[17px] font-black tracking-[2.5px]" style={{ color: Colors.dark.text }}>
                PALLY
              </div>
              <div className="text-[10px] font-medium tracking-[0.5px] -mt-0.5" style={{ color: Colors.dark.textMuted }}>
                Family Feud
              </div>
            </div>
          </div>

          <div className="flex gap-1.5">
            <div
              className="flex items-center gap-[5px] px-2.5 py-[7px] rounded-[10px] border"
              style={{ backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border }}
            >
              <span className="text-[9px] font-bold tracking-[1px]" style={{ color: Colors.dark.textMuted }}>
                $
              </span>
              <span className="text-[13px] font-extrabold tabular-nums" style={{ color: Colors.dark.text }}>
                {userBalance.toFixed(0)}
              </span>
            </div>
            {userStreak > 0 && (
              <div
                className="flex items-center gap-[5px] px-2.5 py-[7px] rounded-[10px] border"
                style={{ backgroundColor: Colors.dark.warningDim, borderColor: 'rgba(251, 191, 36, 0.18)' }}
              >
                <Flame size={11} color={Colors.dark.warning} />
                <span className="text-[13px] font-extrabold tabular-nums" style={{ color: Colors.dark.warning }}>
                  {userStreak}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Question Block */}
        <div
          className={cn(
            'mb-6 transition-all duration-400',
            questionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2.5'
          )}
        >
          <div className="flex justify-between items-center mb-4">
            <div
              className="px-[11px] py-[5px] rounded-lg border"
              style={{
                backgroundColor: Colors.dark.accentDim,
                borderColor: Colors.dark.accentGlow,
              }}
            >
              <span
                className="text-[10px] font-extrabold tracking-[1.2px] uppercase"
                style={{ color: Colors.dark.accent }}
              >
                {question.type || 'PREDICTION'}
              </span>
            </div>

            <button
              onClick={togglePayoutMode}
              className="flex items-center gap-[5px] px-2.5 py-1.5 rounded-lg border transition-colors"
              style={{ backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border }}
            >
              {payoutMode === 'even_split' ? (
                <BarChart3 size={11} color={Colors.dark.textSecondary} />
              ) : (
                <Shuffle size={11} color={Colors.dark.blue} />
              )}
              <span
                className="text-[11px] font-semibold"
                style={{ color: payoutMode === 'multiplier_odds' ? Colors.dark.blue : Colors.dark.textSecondary }}
              >
                {payoutMode === 'even_split' ? 'Split' : 'Odds'}
              </span>
            </button>
          </div>

          <h1
            className="text-[26px] font-extrabold leading-[34px] tracking-tight mb-[18px]"
            style={{ color: Colors.dark.text }}
          >
            {question.prompt}
          </h1>

          <CountdownTimer closesAt={new Date(question.revealsAt).getTime()} />
        </div>

        {/* Section Divider */}
        <div className="flex items-center gap-2.5 mb-[18px]">
          <div className="flex-1 h-px" style={{ backgroundColor: Colors.dark.border }} />
          <div
            className="flex items-center gap-[5px] px-2.5 py-1 rounded-md border"
            style={{ backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border }}
          >
            <Crosshair size={10} color={Colors.dark.accent} strokeWidth={2.5} />
            <span
              className="text-[9px] font-extrabold tracking-[1.8px]"
              style={{ color: Colors.dark.textMuted }}
            >
              {hasConfirmed ? 'LOCKED' : 'YOUR CALL'}
            </span>
          </div>
          <div className="flex-1 h-px" style={{ backgroundColor: Colors.dark.border }} />
        </div>

        {/* Options Grid */}
        <div className="flex flex-wrap justify-between mb-1.5">
          {options.map((option, index) => (
            <AnswerCard
              key={option.id}
              text={option.text}
              optionId={option.id}
              index={index}
              isSelected={selectedOptionId === option.id}
              isLocked={hasConfirmed}
              onPress={() => handleSelectOption(index)}
            />
          ))}
        </div>

        {/* Wager Selector */}
        {!hasConfirmed && selectedOptionId && (
          <WagerSelector
            wagerAmount={wagerAmount}
            maxPoints={userBalance}
            isLocked={hasConfirmed}
            onWagerChange={setWagerAmount}
          />
        )}

        {/* Locked State */}
        {hasConfirmed && (
          <div className="space-y-2.5">
            <div
              className="flex items-center gap-3.5 p-4 rounded-[14px] border"
              style={{
                backgroundColor: Colors.dark.surface,
                borderColor: Colors.dark.border,
                borderLeftWidth: 3,
                borderLeftColor: Colors.dark.accent,
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: Colors.dark.accentDim }}
              >
                <Lock size={16} color={Colors.dark.accent} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold mb-[3px]" style={{ color: Colors.dark.text }}>
                  Prediction sealed
                </div>
                <div className="text-[13px] font-semibold" style={{ color: Colors.dark.accent }}>
                  {selectedOption?.text}
                </div>
              </div>
              <div
                className="text-center px-2.5 py-1.5 rounded-[10px] border"
                style={{ backgroundColor: Colors.dark.warningDim, borderColor: 'rgba(251, 191, 36, 0.18)' }}
              >
                <div className="text-[8px] font-extrabold tracking-[1px] mb-[1px]" style={{ color: Colors.dark.textMuted }}>
                  WAGERED
                </div>
                <div className="text-[15px] font-black tabular-nums" style={{ color: Colors.dark.warning }}>
                  ${wagerAmount}
                </div>
              </div>
            </div>

            <button
              onClick={handleViewResults}
              className="w-full flex items-center justify-center gap-1.5 py-4 rounded-[14px] transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                backgroundColor: Colors.dark.accent,
                boxShadow: `0 4px 12px ${Colors.dark.accent}40`,
              }}
            >
              <span className="text-[15px] font-bold text-white">See Results</span>
              <ChevronRight size={16} color="#fff" strokeWidth={2.5} />
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-center mt-[18px]">
          <div
            className="flex items-center gap-[5px] px-3 py-[7px] rounded-lg border"
            style={{ backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border }}
          >
            <Users size={11} color={Colors.dark.textMuted} />
            <span className="text-[11px] font-medium" style={{ color: Colors.dark.textMuted }}>
              {telegramUser?.first_name ? `Welcome, ${telegramUser.first_name}` : 'Playing now'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
