export interface AnswerOption {
  id: string;
  text: string;
  emoji?: string;
}

export interface DailyQuestion {
  id: string;
  date: string;
  question: string;
  category: string;
  options: AnswerOption[];
  closesAt: number;
  isActive: boolean;
}

export interface VoteDistribution {
  optionId: string;
  percentage: number;
  count: number;
}

export interface RoundResult {
  questionId: string;
  totalVotes: number;
  distribution: VoteDistribution[];
  winningOptionId: string;
  userOptionId: string | null;
  userWon: boolean;
  payoutPoints: number;
  wagerAmount: number;
  multiplier: number;
}

export type PayoutMode = 'even_split' | 'multiplier_odds';

export const WAGER_PRESETS = [50, 100, 250, 500, 1000] as const;
export type WagerPreset = (typeof WAGER_PRESETS)[number];

export interface UserStats {
  totalPoints: number;
  totalGames: number;
  totalWins: number;
  currentStreak: number;
  bestStreak: number;
  winRate: number;
  xp: number;
  level: number;
  referralCount: number;
  todayAnswered: boolean;
  todayOptionId: string | null;
  todayQuestionId: string | null;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  avatar: string;
  points: number;
  winRate: number;
  streak: number;
  isCurrentUser?: boolean;
}

export type LeaderboardPeriod = 'daily' | 'weekly' | 'allTime';
