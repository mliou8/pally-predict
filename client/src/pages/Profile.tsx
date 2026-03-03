import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePrivy } from '@privy-io/react-auth';
import { Link } from 'wouter';
import { Trophy, Wallet, Copy, Share2, Gift, Target, Flame, Users, ChevronRight, Check, Star } from 'lucide-react';
import HistoryCard from '@/components/HistoryCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import Colors from '@/constants/colors';
import { cn } from '@/lib/utils';
import type { User, Vote, Question, QuestionResults } from '@shared/schema';

interface UserStats {
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  totalWagered: string;
  totalEarned: string;
  profit: string;
  alphaPoints: number;
  currentStreak: number;
  maxStreak: number;
}

interface VoteWithDetails {
  vote: Vote;
  question: Question;
  results: QuestionResults | null;
}

interface LeaderboardEntry {
  rank: number;
  handle: string;
  points: number;
  isCurrentUser: boolean;
}

// Tier system based on points
const TIERS = [
  { name: 'Wood', min: 0, max: 499, color: '#8B7355', emoji: '🪵' },
  { name: 'Bronze', min: 500, max: 1499, color: '#CD7F32', emoji: '🥉' },
  { name: 'Silver', min: 1500, max: 2999, color: '#C0C0C0', emoji: '🥈' },
  { name: 'Gold', min: 3000, max: 5999, color: '#FFD700', emoji: '🥇' },
  { name: 'Platinum', min: 6000, max: 9999, color: '#E5E4E2', emoji: '💎' },
  { name: 'Diamond', min: 10000, max: Infinity, color: '#B9F2FF', emoji: '💠' },
];

const getTierInfo = (points: number) => {
  const tier = TIERS.find(t => points >= t.min && points <= t.max) || TIERS[0];
  const tierIndex = TIERS.indexOf(tier);
  const nextTier = tierIndex < TIERS.length - 1 ? TIERS[tierIndex + 1] : null;

  const progressInTier = points - tier.min;
  const tierRange = tier.max === Infinity ? 10000 : tier.max - tier.min + 1;
  const progressPercent = Math.min(100, (progressInTier / tierRange) * 100);
  const pointsToNext = nextTier ? nextTier.min - points : 0;

  return { tier, nextTier, progressPercent, pointsToNext };
};

// Quest definitions
const QUESTS = [
  { id: 'referral', title: 'Invite Friends', description: 'Invite 3 friends', target: 3, icon: Users, reward: 1500 },
  { id: 'predictions', title: 'Daily Predictions', description: 'Make 10 predictions', target: 10, icon: Target, reward: 500 },
  { id: 'streak', title: 'Win Streak', description: 'Get a 5-day streak', target: 5, icon: Flame, reward: 1000 },
];

export default function Profile() {
  const [activeTab, setActiveTab] = useState('rewards');
  const [copied, setCopied] = useState(false);
  const { user } = usePrivy();

  const { data: currentUser, isLoading: isLoadingUser, error: userError } = useQuery<User>({
    queryKey: ['/api/user/me'],
    enabled: !!user,
  });

  const { data: userStats, isLoading: isLoadingStats } = useQuery<UserStats>({
    queryKey: ['/api/user/stats'],
    enabled: !!user && !!currentUser,
  });

  const { data: votes = [], isLoading: isLoadingVotes } = useQuery<Vote[]>({
    queryKey: ['/api/votes/mine'],
    enabled: !!user,
  });

  const { data: leaderboard = [] } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/leaderboard/points'],
    enabled: !!user,
  });

  const { data: votesWithDetails = [] } = useQuery<VoteWithDetails[]>({
    queryKey: ['/api/votes/mine/details'],
    queryFn: async () => {
      const details = await Promise.all(
        votes.map(async (vote) => {
          try {
            const questionResponse = await fetch(`/api/questions/${vote.questionId}`);
            const question = await questionResponse.json();
            let results = null;
            if (question.isRevealed) {
              const resultsResponse = await fetch(`/api/results/${vote.questionId}`);
              results = await resultsResponse.json();
            }
            return { vote, question, results };
          } catch (error) {
            return null;
          }
        })
      );
      return details.filter((d): d is VoteWithDetails => d !== null);
    },
    enabled: !!user && votes.length > 0,
  });

  const referralLink = currentUser?.handle
    ? `${window.location.origin}?ref=${currentUser.handle}`
    : '';

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferralLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Pally Predict',
          text: 'Think you can predict what the crowd will pick? Join me on Pally Predict and we both get 500 points!',
          url: referralLink,
        });
      } catch (err) {
        copyReferralLink();
      }
    } else {
      copyReferralLink();
    }
  };

  // Mock quest progress - in production this would come from the API
  const questProgress = {
    referral: currentUser?.referralCount || 0,
    predictions: userStats?.totalPredictions || 0,
    streak: currentUser?.currentStreak || 0,
  };

  // Mock claimable rewards
  const claimableSOL = 0;
  const claimablePoints = 0;

  const tierInfo = currentUser ? getTierInfo(currentUser.alphaPoints) : null;

  if (!user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: Colors.dark.background }}
      >
        <p style={{ color: Colors.dark.textMuted }}>Please log in to view profile</p>
      </div>
    );
  }

  if (userError) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: Colors.dark.background }}
      >
        <div className="text-center space-y-4 max-w-md">
          <p className="font-semibold" style={{ color: Colors.dark.error }}>Unable to load profile</p>
          <p className="text-sm" style={{ color: Colors.dark.textMuted }}>
            {userError instanceof Error ? userError.message : 'An error occurred'}
          </p>
          <Link href="/create-profile">
            <Button className="w-full">Create Profile</Button>
          </Link>
        </div>
      </div>
    );
  }

  const renderHistory = (history: VoteWithDetails[]) => {
    if (history.length === 0) {
      return (
        <div className="text-center py-12">
          <p style={{ color: Colors.dark.textMuted }} className="mb-2">No history yet</p>
          <p className="text-sm" style={{ color: Colors.dark.textMuted }}>
            Start playing to build your track record
          </p>
        </div>
      );
    }

    return history.map(({ vote, question, results }) => {
      const optionLabels: Record<string, string> = {
        A: question.optionA,
        B: question.optionB,
        C: question.optionC || '',
        D: question.optionD || '',
      };

      const userChoiceLabel = optionLabels[vote.choice] || vote.choice;
      const pointsEarned = vote.pointsEarned || 0;
      const crowdSplitA = results?.percentA || 0;
      const crowdSplitB = results?.percentB || 0;

      let outcome: 'correct' | 'incorrect' | 'pending' = 'pending';

      if (results) {
        outcome = pointsEarned > 0 ? 'correct' : 'incorrect';
      }

      return (
        <HistoryCard
          key={vote.id}
          question={question.prompt}
          choice={vote.choice}
          userChoiceLabel={userChoiceLabel}
          outcome={outcome}
          pointsEarned={pointsEarned}
          timestamp={vote.votedAt.toString()}
          crowdSplitA={crowdSplitA}
          crowdSplitB={crowdSplitB}
          isPublic={vote.isPublic}
        />
      );
    });
  };

  // Circular progress component
  const CircularProgress = ({ progress, size = 48, strokeWidth = 4 }: { progress: number; size?: number; strokeWidth?: number }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={Colors.dark.surface}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={Colors.dark.accent}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
    );
  };

  return (
    <div className="min-h-screen pb-20 md:pb-6" style={{ backgroundColor: Colors.dark.background }}>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

        {isLoadingUser ? (
          <>
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </>
        ) : currentUser && tierInfo ? (
          <>
            {/* Profile Header */}
            <div
              className="rounded-2xl p-6 text-center"
              style={{ backgroundColor: Colors.dark.card }}
            >
              {/* Avatar with tier badge */}
              <div className="relative inline-block mb-4">
                <Avatar className="h-20 w-20 border-4" style={{ borderColor: tierInfo.tier.color }}>
                  <AvatarFallback
                    className="text-2xl font-bold"
                    style={{ backgroundColor: Colors.dark.surface, color: Colors.dark.text }}
                  >
                    {currentUser.handle?.substring(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-lg"
                  style={{ backgroundColor: Colors.dark.card, border: `2px solid ${tierInfo.tier.color}` }}
                >
                  {tierInfo.tier.emoji}
                </div>
              </div>

              {/* Handle */}
              <h2
                className="text-xl font-bold mb-1"
                style={{ color: Colors.dark.text }}
              >
                @{currentUser.handle || 'User'}
              </h2>

              {/* Tier name */}
              <p
                className="text-sm font-medium mb-4"
                style={{ color: tierInfo.tier.color }}
              >
                {tierInfo.tier.name} Tier
              </p>

              {/* Points display */}
              <div className="flex justify-center gap-8 mb-4">
                <div>
                  <div
                    className="text-3xl font-bold"
                    style={{ color: Colors.dark.accent }}
                  >
                    {currentUser.alphaPoints.toLocaleString()}
                  </div>
                  <div className="text-xs" style={{ color: Colors.dark.textMuted }}>
                    POINTS
                  </div>
                </div>
                <div className="w-px" style={{ backgroundColor: Colors.dark.border }} />
                <div>
                  <div
                    className="text-3xl font-bold"
                    style={{ color: Colors.dark.text }}
                  >
                    {userStats?.totalEarned ? (Number(userStats.totalEarned) / 1e9).toFixed(2) : '0.00'}
                  </div>
                  <div className="text-xs" style={{ color: Colors.dark.textMuted }}>
                    SOL EARNED
                  </div>
                </div>
              </div>

              {/* Progress to next tier */}
              {tierInfo.nextTier && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs" style={{ color: Colors.dark.textMuted }}>
                    <span>{tierInfo.tier.name}</span>
                    <span>{tierInfo.pointsToNext.toLocaleString()} pts to {tierInfo.nextTier.name}</span>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: Colors.dark.surface }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${tierInfo.progressPercent}%`,
                        backgroundColor: Colors.dark.accent
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Referral Section */}
            <div
              className="rounded-2xl p-5"
              style={{ backgroundColor: Colors.dark.card }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: Colors.dark.accentDim }}
                >
                  <Gift size={20} style={{ color: Colors.dark.accent }} />
                </div>
                <div>
                  <h3 className="font-semibold" style={{ color: Colors.dark.text }}>
                    Invite Friends
                  </h3>
                  <p className="text-sm" style={{ color: Colors.dark.textMuted }}>
                    You both get <span style={{ color: Colors.dark.accent, fontWeight: 'bold' }}>500 points</span>
                  </p>
                </div>
              </div>

              <div
                className="flex items-center gap-2 p-3 rounded-xl mb-3"
                style={{ backgroundColor: Colors.dark.surface }}
              >
                <input
                  type="text"
                  readOnly
                  value={referralLink}
                  className="flex-1 bg-transparent text-sm outline-none truncate"
                  style={{ color: Colors.dark.text }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={copyReferralLink}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all",
                    "active:scale-[0.98]"
                  )}
                  style={{ backgroundColor: Colors.dark.surface, color: Colors.dark.text }}
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                  <span className="font-medium">{copied ? 'Copied!' : 'Copy Link'}</span>
                </button>
                <button
                  onClick={shareReferralLink}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all",
                    "active:scale-[0.98]"
                  )}
                  style={{ backgroundColor: Colors.dark.accent }}
                >
                  <Share2 size={18} color="#000" />
                  <span className="font-medium" style={{ color: '#000' }}>Share</span>
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div
              className="flex rounded-xl p-1"
              style={{ backgroundColor: Colors.dark.surface }}
            >
              {['Rewards', 'Leaderboard', 'History'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab.toLowerCase())}
                  className={cn(
                    "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all"
                  )}
                  style={{
                    backgroundColor: activeTab === tab.toLowerCase() ? Colors.dark.card : 'transparent',
                    color: activeTab === tab.toLowerCase() ? Colors.dark.text : Colors.dark.textMuted
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'rewards' && (
              <div className="space-y-4">
                {/* Claim Section */}
                <div
                  className="rounded-2xl p-5"
                  style={{ backgroundColor: Colors.dark.card }}
                >
                  <h3
                    className="text-sm font-medium mb-4 uppercase tracking-wider"
                    style={{ color: Colors.dark.textMuted }}
                  >
                    Claim Rewards
                  </h3>

                  <div className="space-y-3">
                    {/* SOL Rewards */}
                    <div
                      className="flex items-center justify-between p-4 rounded-xl"
                      style={{ backgroundColor: Colors.dark.surface }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: 'rgba(153, 69, 255, 0.2)' }}
                        >
                          <Wallet size={18} style={{ color: '#9945FF' }} />
                        </div>
                        <div>
                          <div className="font-semibold" style={{ color: Colors.dark.text }}>
                            {claimableSOL.toFixed(4)} SOL
                          </div>
                          <div className="text-xs" style={{ color: Colors.dark.textMuted }}>
                            Available to claim
                          </div>
                        </div>
                      </div>
                      <button
                        disabled={claimableSOL === 0}
                        className={cn(
                          "py-2 px-4 rounded-lg text-sm font-medium transition-all",
                          claimableSOL > 0 ? "active:scale-[0.98]" : "opacity-50"
                        )}
                        style={{
                          backgroundColor: claimableSOL > 0 ? '#9945FF' : Colors.dark.border,
                          color: '#fff'
                        }}
                      >
                        Claim
                      </button>
                    </div>

                    {/* Points Rewards */}
                    <div
                      className="flex items-center justify-between p-4 rounded-xl"
                      style={{ backgroundColor: Colors.dark.surface }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: Colors.dark.accentDim }}
                        >
                          <Star size={18} style={{ color: Colors.dark.accent }} />
                        </div>
                        <div>
                          <div className="font-semibold" style={{ color: Colors.dark.text }}>
                            {claimablePoints.toLocaleString()} Points
                          </div>
                          <div className="text-xs" style={{ color: Colors.dark.textMuted }}>
                            Quest rewards
                          </div>
                        </div>
                      </div>
                      <button
                        disabled={claimablePoints === 0}
                        className={cn(
                          "py-2 px-4 rounded-lg text-sm font-medium transition-all",
                          claimablePoints > 0 ? "active:scale-[0.98]" : "opacity-50"
                        )}
                        style={{
                          backgroundColor: claimablePoints > 0 ? Colors.dark.accent : Colors.dark.border,
                          color: claimablePoints > 0 ? '#000' : Colors.dark.textMuted
                        }}
                      >
                        Claim
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quests */}
                <div
                  className="rounded-2xl p-5"
                  style={{ backgroundColor: Colors.dark.card }}
                >
                  <h3
                    className="text-sm font-medium mb-4 uppercase tracking-wider"
                    style={{ color: Colors.dark.textMuted }}
                  >
                    Quests
                  </h3>

                  <div className="space-y-4">
                    {QUESTS.map((quest) => {
                      const current = questProgress[quest.id as keyof typeof questProgress] || 0;
                      const progress = Math.min(100, (current / quest.target) * 100);
                      const isComplete = current >= quest.target;
                      const Icon = quest.icon;

                      return (
                        <div
                          key={quest.id}
                          className="flex items-center gap-4"
                        >
                          <div className="relative">
                            <CircularProgress progress={progress} />
                            <div
                              className="absolute inset-0 flex items-center justify-center"
                            >
                              <Icon
                                size={20}
                                style={{ color: isComplete ? Colors.dark.accent : Colors.dark.textMuted }}
                              />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span
                                className="font-medium"
                                style={{ color: Colors.dark.text }}
                              >
                                {quest.title}
                              </span>
                              <span
                                className="text-sm font-bold"
                                style={{ color: Colors.dark.accent }}
                              >
                                +{quest.reward}
                              </span>
                            </div>
                            <div
                              className="text-sm"
                              style={{ color: Colors.dark.textMuted }}
                            >
                              {quest.description} ({current}/{quest.target})
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Link Wallet CTA */}
                {!currentUser.solanaAddress && (
                  <div
                    className="rounded-2xl p-5 border-2 border-dashed"
                    style={{
                      backgroundColor: 'rgba(153, 69, 255, 0.05)',
                      borderColor: 'rgba(153, 69, 255, 0.3)'
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(153, 69, 255, 0.2)' }}
                      >
                        <Wallet size={24} style={{ color: '#9945FF' }} />
                      </div>
                      <div className="flex-1">
                        <h3
                          className="font-semibold mb-1"
                          style={{ color: Colors.dark.text }}
                        >
                          Link Wallet for Payouts
                        </h3>
                        <p
                          className="text-sm"
                          style={{ color: Colors.dark.textMuted }}
                        >
                          Connect Phantom to receive SOL rewards
                        </p>
                      </div>
                      <Link href="/link-wallet">
                        <ChevronRight size={24} style={{ color: Colors.dark.textMuted }} />
                      </Link>
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div
                  className="rounded-2xl p-5"
                  style={{ backgroundColor: Colors.dark.card }}
                >
                  <h3
                    className="text-sm font-medium mb-4 uppercase tracking-wider"
                    style={{ color: Colors.dark.textMuted }}
                  >
                    Your Stats
                  </h3>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div
                        className="text-2xl font-bold"
                        style={{ color: Colors.dark.text }}
                      >
                        {userStats?.accuracy || 0}%
                      </div>
                      <div className="text-xs" style={{ color: Colors.dark.textMuted }}>
                        Win Rate
                      </div>
                    </div>
                    <div className="text-center">
                      <div
                        className="text-2xl font-bold"
                        style={{ color: Colors.dark.text }}
                      >
                        {currentUser.currentStreak}
                      </div>
                      <div className="text-xs" style={{ color: Colors.dark.textMuted }}>
                        Streak
                      </div>
                    </div>
                    <div className="text-center">
                      <div
                        className="text-2xl font-bold"
                        style={{ color: Colors.dark.text }}
                      >
                        {userStats?.totalPredictions || 0}
                      </div>
                      <div className="text-xs" style={{ color: Colors.dark.textMuted }}>
                        Played
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'leaderboard' && (
              <div
                className="rounded-2xl p-5"
                style={{ backgroundColor: Colors.dark.card }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className="text-sm font-medium uppercase tracking-wider"
                    style={{ color: Colors.dark.textMuted }}
                  >
                    Top Players
                  </h3>
                  <Link href="/leaderboard">
                    <span
                      className="text-sm flex items-center gap-1"
                      style={{ color: Colors.dark.accent }}
                    >
                      See All <ChevronRight size={16} />
                    </span>
                  </Link>
                </div>

                <div className="space-y-3">
                  {leaderboard.length > 0 ? (
                    leaderboard.slice(0, 10).map((entry, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl",
                          entry.isCurrentUser && "ring-2"
                        )}
                        style={{
                          backgroundColor: Colors.dark.surface,
                          ...(entry.isCurrentUser && { ringColor: Colors.dark.accent })
                        }}
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                          style={{
                            backgroundColor: index < 3 ? Colors.dark.accent : Colors.dark.border,
                            color: index < 3 ? '#000' : Colors.dark.textMuted
                          }}
                        >
                          {entry.rank}
                        </div>
                        <div className="flex-1">
                          <span
                            className="font-medium"
                            style={{ color: Colors.dark.text }}
                          >
                            @{entry.handle}
                          </span>
                        </div>
                        <span
                          className="font-bold"
                          style={{ color: Colors.dark.accent }}
                        >
                          {entry.points.toLocaleString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8" style={{ color: Colors.dark.textMuted }}>
                      <Trophy size={32} className="mx-auto mb-2 opacity-50" />
                      <p>Leaderboard coming soon</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-3">
                {isLoadingVotes ? (
                  <>
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-32 w-full rounded-xl" />
                    ))}
                  </>
                ) : (
                  renderHistory(votesWithDetails)
                )}
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
