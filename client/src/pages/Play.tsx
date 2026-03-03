import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { usePrivy, useLogin } from '@privy-io/react-auth';
import { useLocation } from 'wouter';
import { Lock, ArrowRight, TrendingUp, Share2, Bell } from 'lucide-react';
import Colors from '@/constants/colors';
import { cn } from '@/lib/utils';
import AnswerCard from '@/components/game/AnswerCard';
import CountdownTimer from '@/components/game/CountdownTimer';
import WagerSelector from '@/components/game/WagerSelector';
import ActivityFeed from '@/components/game/ActivityFeed';
import ConfettiEffect from '@/components/game/ConfettiEffect';
import RecentPolls from '@/components/RecentPolls';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, ApiError } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import type { VoteChoice, Question, Vote, User } from '@shared/schema';

interface LiveStats {
  totalVotes: number;
  distribution: {
    A: { votes: number; percent: number; multiplier: number };
    B: { votes: number; percent: number; multiplier: number };
    C: { votes: number; percent: number; multiplier: number };
    D: { votes: number; percent: number; multiplier: number };
  };
}

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
      setUserPoints(DEFAULT_POINTS);
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

  // Fetch live stats for the current question
  const { data: liveStats } = useQuery<LiveStats>({
    queryKey: ['/api/questions', question?.id, 'live-stats'],
    queryFn: async () => {
      const res = await fetch(`/api/questions/${question!.id}/live-stats`);
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
    enabled: !!question?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000,
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
        if (existingVote.wagerAmount) {
          setWagerAmount(Number(existingVote.wagerAmount) / 1e9 * 100);
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
      setHasConfirmed(true);
      setShowConfetti(true);
      toast({
        title: 'Locked in!',
        description: 'If the crowd agrees with you, you win.',
      });
    },
    onError: (error: Error) => {
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

  const handleSelectOption = useCallback((index: number) => {
    if (hasConfirmed) return;
    setSelectedOptionId(OPTION_LABELS[index]);
  }, [hasConfirmed]);

  const handleConfirm = useCallback(() => {
    if (!selectedOptionId || hasConfirmed) return;

    const voteData: VoteData = {
      questionId: question!.id,
      choice: selectedOptionId,
      isPublic: true,
      wagerAmount: undefined,
    };

    if (!authenticated || !user) {
      setPendingVote(voteData);
      login();
      return;
    }

    setUserPoints((prev) => prev - wagerAmount);
    setHasConfirmed(true);
    voteMutation.mutate(voteData);
  }, [selectedOptionId, hasConfirmed, question, authenticated, user, login, wagerAmount, voteMutation]);

  useEffect(() => {
    if (pendingVote && authenticated && user && currentUser) {
      setUserPoints((prev) => prev - wagerAmount);
      setHasConfirmed(true);
      voteMutation.mutate(pendingVote);
      setPendingVote(null);
    }
  }, [pendingVote, authenticated, user, currentUser, wagerAmount, voteMutation]);

  const handleViewPastPolls = useCallback(() => {
    setLocation('/history');
  }, [setLocation]);

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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: Colors.dark.background }}>
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: Colors.dark.accent, borderTopColor: 'transparent' }}
        />
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
          {/* Main Poll Column */}
          <div className="flex-1 max-w-xl">
        {/* Header */}
        <div
          className={cn(
            'flex justify-between items-center mb-10 transition-all duration-500',
            contentVisible ? 'opacity-100' : 'opacity-0'
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: Colors.dark.accent }}
            >
              <span className="text-lg font-black" style={{ color: '#000' }}>P</span>
            </div>
            <div>
              <div
                className="text-base font-bold"
                style={{ color: Colors.dark.text }}
              >
                PALLY
              </div>
            </div>
          </div>

          <div
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: Colors.dark.surface }}
          >
            <span
              className="text-sm font-bold tabular-nums"
              style={{
                color: Colors.dark.text,
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {userPoints.toLocaleString()}
            </span>
            <span
              className="text-xs font-medium ml-1"
              style={{ color: Colors.dark.textMuted }}
            >
              pts
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
          {options.map((option, index) => {
            const optionKey = option.id as 'A' | 'B' | 'C' | 'D';
            const stats = liveStats?.distribution[optionKey];
            return (
              <AnswerCard
                key={option.id}
                text={option.text}
                index={index}
                isSelected={selectedOptionId === option.id}
                isLocked={hasConfirmed}
                onPress={() => handleSelectOption(index)}
                percent={stats?.percent}
                multiplier={stats?.multiplier}
              />
            );
          })}
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
                {voteMutation.isPending ? 'Locking...' : `Lock in for ${wagerAmount} pts`}
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

            {/* Share and Notification CTAs */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const shareText = `I just made my prediction on Pally! What do you think?`;
                  if (navigator.share) {
                    navigator.share({ text: shareText, url: window.location.href });
                  } else {
                    navigator.clipboard.writeText(`${shareText} ${window.location.href}`);
                    toast({ title: 'Copied to clipboard', description: 'Share link copied!' });
                  }
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
                  Share your prediction
                </span>
              </button>
            </div>

            <button
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

            {/* Live Activity Feed - shown after lock-in */}
            {question && (
              <div className="mt-4">
                <ActivityFeed questionId={question.id} />
              </div>
            )}

            <button
              onClick={handleViewPastPolls}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-4 rounded-xl transition-all',
                'active:scale-[0.98]'
              )}
              style={{ backgroundColor: Colors.dark.surface }}
            >
              <span
                className="text-base font-semibold"
                style={{ color: Colors.dark.text }}
              >
                Past Polls
              </span>
              <ArrowRight size={18} color={Colors.dark.textSecondary} />
            </button>
          </div>
        )}

        {/* Total Volume */}
        <div
          className={cn(
            'mt-8 transition-all duration-500 delay-300',
            contentVisible ? 'opacity-100' : 'opacity-0'
          )}
        >
          <div
            className="rounded-xl p-4 flex items-center justify-between"
            style={{ backgroundColor: Colors.dark.surface }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: Colors.dark.accentDim }}
              >
                <TrendingUp size={16} color={Colors.dark.accent} />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider" style={{ color: Colors.dark.textMuted }}>
                  Total Volume
                </div>
                <div className="text-lg font-bold" style={{ color: Colors.dark.textMuted }}>
                  Coming soon
                </div>
              </div>
            </div>
          </div>
        </div>

          </div>

          {/* Sidebar - Past Polls (Desktop only) */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-8">
              <RecentPolls />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
