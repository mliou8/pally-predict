import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { usePrivy, useLogin } from '@privy-io/react-auth';
import { useLocation } from 'wouter';
import { Users, Flame, ChevronRight, Lock, Crosshair, BarChart3, Shuffle } from 'lucide-react';
import Colors from '@/constants/colors';
import { cn } from '@/lib/utils';
import AnswerCard from '@/components/game/AnswerCard';
import CountdownTimer from '@/components/game/CountdownTimer';
import WagerSelector from '@/components/game/WagerSelector';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, ApiError } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import type { VoteChoice, Question, Vote, User } from '@shared/schema';
import type { PayoutMode } from '@/types/game';

interface VoteData {
  questionId: string;
  choice: VoteChoice;
  isPublic: boolean;
  wagerAmount?: string;
}

const DEFAULT_POINTS = 1000;
const OPTION_LABELS: VoteChoice[] = ['A', 'B', 'C', 'D'];

export default function Play() {
  const { user, authenticated, ready } = usePrivy();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Local game state
  const [selectedOptionId, setSelectedOptionId] = useState<VoteChoice | null>(null);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [wagerAmount, setWagerAmount] = useState(100);
  const [payoutMode, setPayoutMode] = useState<PayoutMode>('even_split');
  const [pendingVote, setPendingVote] = useState<VoteData | null>(null);
  const [userPoints, setUserPoints] = useState(DEFAULT_POINTS);
  const [currentStreak, setCurrentStreak] = useState(0);

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

  // Login hook for unauthenticated users
  const { login } = useLogin({
    onComplete: () => {
      // Vote will be processed via useEffect
    },
    onError: (error) => {
      console.error('Login error:', error);
      setPendingVote(null);
      toast({
        title: 'Login failed',
        description: 'Please try again',
        variant: 'destructive',
      });
    },
  });

  // Fetch user profile
  const [enableQuery, setEnableQuery] = useState(false);
  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => setEnableQuery(true), 300);
      return () => clearTimeout(timer);
    } else {
      setEnableQuery(false);
    }
  }, [user]);

  const { data: currentUser, isLoading: isLoadingUser, isError, error } = useQuery<User>({
    queryKey: ['/api/user/me'],
    enabled: enableQuery,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
    staleTime: 60000,
  });

  // Update points from user data
  useEffect(() => {
    if (currentUser) {
      // For now use default points, could be extended to use actual balance
      setUserPoints(DEFAULT_POINTS);
    }
  }, [currentUser]);

  // Redirect to create-profile if user doesn't have a profile
  useEffect(() => {
    if (user && !isLoadingUser && isError && error) {
      if (error instanceof ApiError && error.status === 404) {
        setLocation('/create-profile');
      }
    }
  }, [user, isLoadingUser, isError, error, setLocation]);

  // Fetch active questions
  const { data: activeQuestions = [], isLoading: isLoadingActive } = useQuery<Question[]>({
    queryKey: ['/api/questions/active'],
    enabled: ready,
  });

  // User votes
  const { data: userVotes = [] } = useQuery<Vote[]>({
    queryKey: ['/api/votes/mine'],
    enabled: !!user && !!currentUser,
  });

  // Get today's question
  const question = activeQuestions[0];

  // Check if user already voted on this question
  useEffect(() => {
    if (question && userVotes.length > 0) {
      const existingVote = userVotes.find((v) => v.questionId === question.id);
      if (existingVote) {
        setSelectedOptionId(existingVote.choice);
        setHasConfirmed(true);
        if (existingVote.wagerAmount) {
          setWagerAmount(Number(existingVote.wagerAmount) / 1e9 * 100); // Convert back to points
        }
      }
    }
  }, [question, userVotes]);

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async (voteData: VoteData) => {
      if (!user?.id) throw new Error('Not authenticated');
      const response = await apiRequest('/api/votes', {
        method: 'POST',
        body: JSON.stringify(voteData),
      }, user.id);
      const result = await response.json();
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/votes/mine'] });
      queryClient.invalidateQueries({ queryKey: ['/api/questions/active'] });
      setHasConfirmed(true);
      toast({
        title: 'Prediction locked in!',
        description: 'Your answer has been recorded.',
      });
    },
    onError: (error: Error) => {
      if (error instanceof ApiError && error.status === 404) {
        setLocation('/create-profile');
        toast({
          title: 'Profile Required',
          description: 'Please create your profile to play',
        });
      } else {
        toast({
          title: 'Failed to submit',
          description: error.message,
          variant: 'destructive',
        });
      }
      setHasConfirmed(false);
    },
  });

  // Handle option selection
  const handleSelectOption = useCallback((index: number) => {
    if (hasConfirmed) return;
    setSelectedOptionId(OPTION_LABELS[index]);
  }, [hasConfirmed]);

  // Handle confirm
  const handleConfirm = useCallback(() => {
    if (!selectedOptionId || hasConfirmed) return;

    const voteData: VoteData = {
      questionId: question!.id,
      choice: selectedOptionId,
      isPublic: true,
      wagerAmount: undefined, // Points-based for now
    };

    // If not authenticated, trigger login
    if (!authenticated || !user) {
      setPendingVote(voteData);
      login();
      return;
    }

    // Deduct points locally
    setUserPoints((prev) => prev - wagerAmount);
    setHasConfirmed(true);

    // Submit vote
    voteMutation.mutate(voteData);
  }, [selectedOptionId, hasConfirmed, question, authenticated, user, login, wagerAmount, voteMutation]);

  // Process pending vote after login
  useEffect(() => {
    if (pendingVote && authenticated && user && currentUser) {
      setUserPoints((prev) => prev - wagerAmount);
      setHasConfirmed(true);
      voteMutation.mutate(pendingVote);
      setPendingVote(null);
    }
  }, [pendingVote, authenticated, user, currentUser, wagerAmount, voteMutation]);

  const handleViewResults = useCallback(() => {
    setLocation('/results');
  }, [setLocation]);

  const togglePayoutMode = useCallback(() => {
    setPayoutMode((prev) => (prev === 'even_split' ? 'multiplier_odds' : 'even_split'));
  }, []);

  // Get options from question
  const options = question
    ? [
        { id: 'A', text: question.optionA },
        { id: 'B', text: question.optionB },
        ...(question.optionC ? [{ id: 'C', text: question.optionC }] : []),
        ...(question.optionD ? [{ id: 'D', text: question.optionD }] : []),
      ]
    : [];

  const selectedOption = options.find((o) => o.id === selectedOptionId);

  // Loading state
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: Colors.dark.background }}>
        <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: Colors.dark.accent, borderTopColor: 'transparent' }} />
      </div>
    );
  }

  // No questions
  if (!isLoadingActive && !question) {
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
      <PWAInstallPrompt />
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
                PTS
              </span>
              <span className="text-[13px] font-extrabold tabular-nums" style={{ color: Colors.dark.text }}>
                {userPoints.toLocaleString()}
              </span>
            </div>
            {currentStreak > 0 && (
              <div
                className="flex items-center gap-[5px] px-2.5 py-[7px] rounded-[10px] border"
                style={{ backgroundColor: Colors.dark.warningDim, borderColor: 'rgba(251, 191, 36, 0.18)' }}
              >
                <Flame size={11} color={Colors.dark.warning} />
                <span className="text-[13px] font-extrabold tabular-nums" style={{ color: Colors.dark.warning }}>
                  {currentStreak}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Question Block */}
        {question && (
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
        )}

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
              index={index}
              isSelected={selectedOptionId === option.id}
              isLocked={hasConfirmed}
              onPress={() => handleSelectOption(index)}
            />
          ))}
        </div>

        {/* Wager Selector & Confirm */}
        {!hasConfirmed && selectedOptionId && (
          <>
            <WagerSelector
              wagerAmount={wagerAmount}
              maxPoints={userPoints}
              isLocked={hasConfirmed}
              onWagerChange={setWagerAmount}
            />

            <button
              onClick={handleConfirm}
              disabled={voteMutation.isPending}
              className={cn(
                'w-full rounded-[14px] py-[17px] px-6 flex items-center justify-center gap-2.5 transition-all',
                'hover:opacity-90 active:scale-[0.98]',
                voteMutation.isPending && 'opacity-70 cursor-not-allowed'
              )}
              style={{
                backgroundColor: Colors.dark.accent,
                boxShadow: `0 8px 16px ${Colors.dark.accent}4D`,
              }}
            >
              <span className="text-[15px] font-extrabold text-white tracking-[0.2px]">
                {voteMutation.isPending ? 'Locking...' : `Lock in ${selectedOption?.text}`}
              </span>
              <div
                className="px-2.5 py-1 rounded-lg"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              >
                <span className="text-[11px] font-extrabold text-white tracking-[0.5px]">
                  {wagerAmount} PTS
                </span>
              </div>
            </button>
          </>
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
                  {wagerAmount}
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
              2,847 playing
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
