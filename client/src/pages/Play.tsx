import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { usePrivy, useLogin } from '@privy-io/react-auth';
import { useLocation } from 'wouter';
import { Lock, ArrowRight, TrendingUp, Share2, Bell, Clock } from 'lucide-react';
import Colors from '@/constants/colors';
import { cn } from '@/lib/utils';
import AnswerCard from '@/components/game/AnswerCard';
import CountdownTimer from '@/components/game/CountdownTimer';
import WagerSelector from '@/components/game/WagerSelector';
import ActivityFeed from '@/components/game/ActivityFeed';
import ConfettiEffect from '@/components/game/ConfettiEffect';
import RecentQuestions from '@/components/RecentQuestions';
import Logo from '@/components/ui/Logo';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, ApiError } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import type { VoteChoice, Question, Vote, User } from '@shared/schema';


interface VoteData {
  questionId: string;
  choice: VoteChoice;
  isPublic: boolean;
  betAmount?: string;
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
  const [pendingVote, setPendingVote] = useState<VoteData | null>(null);
  const [userPoints, setUserPoints] = useState(DEFAULT_POINTS);

  // Animations
  const [contentVisible, setContentVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setContentVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Login hook
  const { login } = useLogin({
    onComplete: () => {},
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

  useEffect(() => {
    if (currentUser) {
      // Use actual balance from server, not default
      const balance = parseFloat(currentUser.balance) || 0;
      setUserPoints(balance);
    }
  }, [currentUser]);

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

  const question = activeQuestions[0];

  // Fetch safe stats (total participants and pool only - no distribution to prevent collusion)
  const { data: questionStats } = useQuery<{ totalBets: number; totalAmount: number }>({
    queryKey: ['/api/questions', question?.id, 'safe-stats'],
    queryFn: async () => {
      const response = await fetch(`/api/questions/${question!.id}/live-stats`);
      const data = await response.json();
      // Only return safe stats, not distribution
      return { totalBets: data.totalBets, totalAmount: data.totalAmount };
    },
    enabled: !!question,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // User votes
  const { data: userVotes = [] } = useQuery<Vote[]>({
    queryKey: ['/api/votes/mine'],
    enabled: !!user && !!currentUser,
  });

  // Check existing vote
  useEffect(() => {
    if (question && userVotes.length > 0) {
      const existingVote = userVotes.find((v) => v.questionId === question.id);
      if (existingVote) {
        setSelectedOptionId(existingVote.choice);
        setHasConfirmed(true);
        if (existingVote.betAmount) {
          setWagerAmount(parseFloat(existingVote.betAmount));
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
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/votes/mine'] });
      queryClient.invalidateQueries({ queryKey: ['/api/questions/active'] });
      // Refetch prize pool stats immediately after voting
      queryClient.invalidateQueries({ queryKey: ['/api/questions', question?.id, 'safe-stats'] });
      setHasConfirmed(true);
      setShowConfetti(true);
      toast({
        title: 'Locked in!',
        description: 'If the crowd agrees with you, you win.',
      });
    },
    onError: (error: Error, variables: VoteData) => {
      // Restore points that were optimistically deducted
      const betAmount = parseFloat(variables.betAmount) || 0;
      setUserPoints((prev) => prev + betAmount);

      if (error instanceof ApiError && error.status === 404) {
        setLocation('/create-profile');
      } else {
        toast({
          title: 'Failed',
          description: error.message,
          variant: 'destructive',
        });
      }
      setHasConfirmed(false);
    },
  });

  const handleSelectOption = useCallback((optionId: VoteChoice) => {
    if (hasConfirmed) return;
    setSelectedOptionId(optionId);
  }, [hasConfirmed]);

  const handleConfirm = useCallback(() => {
    if (!selectedOptionId || hasConfirmed) return;

    // Validate wager amount doesn't exceed available balance
    if (wagerAmount > userPoints) {
      toast({
        title: 'Insufficient balance',
        description: `You only have ${userPoints} WP available`,
        variant: 'destructive',
      });
      return;
    }

    if (wagerAmount < 1) {
      toast({
        title: 'Invalid wager',
        description: 'Minimum wager is 1 WP',
        variant: 'destructive',
      });
      return;
    }

    const voteData: VoteData = {
      questionId: question!.id,
      choice: selectedOptionId,
      isPublic: true,
      betAmount: wagerAmount.toString(),
    };

    if (!authenticated || !user) {
      setPendingVote(voteData);
      login();
      return;
    }

    setUserPoints((prev) => prev - wagerAmount);
    setHasConfirmed(true);
    voteMutation.mutate(voteData);
  }, [selectedOptionId, hasConfirmed, question, authenticated, user, login, wagerAmount, userPoints, toast, voteMutation]);

  useEffect(() => {
    if (pendingVote && authenticated && user && currentUser) {
      const betAmount = parseFloat(pendingVote.betAmount) || 0;
      const balance = parseFloat(currentUser.balance) || 0;

      // Validate balance before submitting pending vote
      if (betAmount > balance) {
        toast({
          title: 'Insufficient balance',
          description: `You only have ${balance} WP available`,
          variant: 'destructive',
        });
        setPendingVote(null);
        return;
      }

      setUserPoints((prev) => prev - betAmount);
      setHasConfirmed(true);
      voteMutation.mutate(pendingVote);
      setPendingVote(null);
    }
  }, [pendingVote, authenticated, user, currentUser, toast, voteMutation]);

  const handleViewHistory = useCallback(() => {
    setLocation('/history');
  }, [setLocation]);

  const handleEnableNotifications = useCallback(async () => {
    if (!('Notification' in window)) {
      toast({
        title: 'Not supported',
        description: 'Your browser does not support notifications',
        variant: 'destructive',
      });
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      toast({
        title: 'Notifications enabled',
        description: "We'll notify you when new questions drop and results are revealed",
      });
    } else {
      toast({
        title: 'Notifications blocked',
        description: 'Please enable notifications in your browser settings',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Seeded random shuffle to prevent collusion via "everyone pick option 1"
  // Each user sees options in a different order based on their ID + question ID
  const seededShuffle = useCallback(<T,>(array: T[], seed: string): T[] => {
    const shuffled = [...array];
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash = hash & hash;
    }
    for (let i = shuffled.length - 1; i > 0; i--) {
      hash = ((hash << 5) - hash) + i;
      hash = hash & hash;
      const j = Math.abs(hash) % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  // Get options from question (randomized per user to prevent coordination)
  const options = useMemo(() => {
    if (!question) return [];
    const baseOptions = [
      { id: 'A', text: question.optionA },
      { id: 'B', text: question.optionB },
      ...(question.optionC ? [{ id: 'C', text: question.optionC }] : []),
      ...(question.optionD ? [{ id: 'D', text: question.optionD }] : []),
    ];
    // Use user ID + question ID as seed for consistent but unique ordering
    const seed = (user?.id || 'anonymous') + question.id;
    return seededShuffle(baseOptions, seed);
  }, [question, user?.id, seededShuffle]);

  const selectedOption = options.find((o) => o.id === selectedOptionId);

  // Loading state
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  // No questions - improved empty state
  if (!isLoadingActive && !question) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: Colors.dark.background }}>
        <div
          className="w-16 h-16 rounded-xl flex items-center justify-center mb-6"
          style={{ backgroundColor: Colors.dark.surface }}
        >
          <Bell size={32} color={Colors.dark.accent} />
        </div>
        <h2
          className="text-2xl font-bold mb-2 text-center"
          style={{ color: Colors.dark.text }}
        >
          Next question drops at noon ET
        </h2>
        <p
          className="text-sm text-center mb-8 max-w-xs"
          style={{ color: Colors.dark.textMuted }}
        >
          Check back soon for the next prediction challenge
        </p>
        <button
          onClick={handleEnableNotifications}
          className={cn(
            'flex items-center gap-2 px-6 py-3 rounded-xl transition-all',
            'active:scale-[0.98]'
          )}
          style={{ backgroundColor: Colors.dark.surface }}
        >
          <Bell size={18} color={Colors.dark.accent} />
          <span
            className="text-sm font-semibold"
            style={{ color: Colors.dark.text }}
          >
            Enable notifications
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: Colors.dark.background }}>
      {/* Confetti effect on successful vote */}
      <ConfettiEffect active={showConfetti} />

      <div className="max-w-6xl mx-auto px-5 py-8 pb-28 md:pb-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Question Column */}
          <div className="flex-1 max-w-xl">
        {/* Header */}
        <div
          className={cn(
            'flex justify-between items-center mb-10 transition-all duration-500',
            contentVisible ? 'opacity-100' : 'opacity-0'
          )}
        >
          <Logo size="md" showText />

          <div
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: Colors.dark.surface }}
          >
            <span
              className="text-sm font-bold tabular-nums"
              style={{
                color: Colors.dark.accent,
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {userPoints.toLocaleString()}
            </span>
            <span
              className="text-xs font-semibold ml-1"
              style={{ color: Colors.dark.accent }}
            >
              WP
            </span>
          </div>
        </div>

        {/* Question */}
        {question && (
          <div
            className={cn(
              'mb-8 transition-all duration-500 delay-100',
              contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            {/* Timer */}
            <div className="mb-4">
              <CountdownTimer closesAt={new Date(question.revealsAt).getTime()} />
            </div>

            {/* Question text */}
            <h1
              className="text-3xl md:text-4xl font-bold leading-tight mb-3"
              style={{ color: Colors.dark.text }}
            >
              {question.prompt}
            </h1>

            {/* Consensus game explainer */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: Colors.dark.surface }}
            >
              <span className="text-sm" style={{ color: Colors.dark.accent }}>
                Pick what most people will pick to win
              </span>
            </div>
          </div>
        )}

        {/* Options */}
        <div
          className={cn(
            'mb-6 transition-all duration-500 delay-200',
            contentVisible ? 'opacity-100' : 'opacity-0'
          )}
        >
          {options.map((option, index) => (
            <AnswerCard
              key={option.id}
              text={option.text}
              optionId={option.id}
              index={index}
              isSelected={selectedOptionId === option.id}
              isLocked={hasConfirmed}
              onPress={() => handleSelectOption(option.id as VoteChoice)}
            />
          ))}
        </div>

        {/* Wager & Confirm */}
        {!hasConfirmed && selectedOptionId && (
          <div
            className={cn(
              'transition-all duration-300',
              contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
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
                'w-full rounded-xl py-4 flex items-center justify-center gap-2 transition-all',
                'active:scale-[0.98]',
                voteMutation.isPending && 'opacity-70'
              )}
              style={{ backgroundColor: Colors.dark.accent }}
            >
              <span
                className="text-base font-bold"
                style={{ color: '#000' }}
              >
                {voteMutation.isPending ? 'Locking...' : `Lock in for ${wagerAmount} WP`}
              </span>
              <ArrowRight size={18} color="#000" strokeWidth={2.5} />
            </button>
          </div>
        )}

        {/* Locked State */}
        {hasConfirmed && (
          <div
            className={cn(
              'space-y-3 transition-all duration-300',
              contentVisible ? 'opacity-100' : 'opacity-0'
            )}
          >
            <div
              className="p-4 rounded-xl"
              style={{ backgroundColor: Colors.dark.surface }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: Colors.dark.accentDim }}
                >
                  <Lock size={18} color={Colors.dark.accent} />
                </div>
                <div className="flex-1">
                  <div
                    className="text-sm font-semibold mb-1"
                    style={{ color: Colors.dark.text }}
                  >
                    Prediction locked
                  </div>
                  <div
                    className="text-sm font-medium"
                    style={{ color: Colors.dark.accent }}
                  >
                    {selectedOption?.text}
                  </div>
                </div>
              </div>
              <div
                className="text-xs pt-3 border-t"
                style={{ borderColor: Colors.dark.border, color: Colors.dark.textMuted }}
              >
                If this is the most popular answer, you win a share of the prize pool
              </div>
            </div>

            {/* Share to Twitter CTA */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const shareUrl = window.location.origin;
                  const shareText = `I just locked in my prediction on Pally Feud! 🎯\n\nThink you know what the crowd will pick? Play the daily consensus game:\n\n${shareUrl}`;
                  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
                  window.open(twitterUrl, '_blank', 'width=550,height=420');
                }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-4 rounded-xl transition-all',
                  'active:scale-[0.98]'
                )}
                style={{ backgroundColor: Colors.dark.accent }}
              >
                <Share2 size={18} color="#000" />
                <span
                  className="text-base font-semibold"
                  style={{ color: '#000' }}
                >
                  Share on X
                </span>
              </button>
            </div>

            <button
              onClick={handleEnableNotifications}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-4 rounded-xl transition-all',
                'active:scale-[0.98]'
              )}
              style={{ backgroundColor: Colors.dark.surface }}
            >
              <Bell size={18} color={Colors.dark.accent} />
              <span
                className="text-base font-semibold"
                style={{ color: Colors.dark.text }}
              >
                Get notified when results drop
              </span>
            </button>

            <button
              onClick={handleViewHistory}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-4 rounded-xl transition-all',
                'active:scale-[0.98] border'
              )}
              style={{ backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border }}
            >
              <Clock size={18} color={Colors.dark.accent} />
              <span
                className="text-base font-semibold"
                style={{ color: Colors.dark.text }}
              >
                View Past Results & Claim Rewards
              </span>
              <ArrowRight size={18} color={Colors.dark.textSecondary} />
            </button>
          </div>
        )}

          </div>

          {/* Sidebar (Desktop only) */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-8 space-y-4">
              {/* Prize Pool Stats */}
              <div
                className="rounded-xl p-4"
                style={{ backgroundColor: Colors.dark.surface }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: Colors.dark.accentDim }}
                    >
                      <TrendingUp size={16} color={Colors.dark.accent} />
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider" style={{ color: Colors.dark.textMuted }}>
                        Prize Pool
                      </div>
                      <div className="text-lg font-bold" style={{ color: Colors.dark.accent }}>
                        {questionStats?.totalAmount != null ? `${Math.round(questionStats.totalAmount).toLocaleString()} WP` : '—'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs uppercase tracking-wider" style={{ color: Colors.dark.textMuted }}>
                      Players
                    </div>
                    <div className="text-lg font-bold" style={{ color: Colors.dark.text }}>
                      {questionStats?.totalBets != null ? questionStats.totalBets.toLocaleString() : '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Activity Feed */}
              {question && (
                <ActivityFeed questionId={question.id} />
              )}

              {/* Recent Questions */}
              <RecentQuestions />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
