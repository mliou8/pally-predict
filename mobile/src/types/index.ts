export interface User {
  id: string;
  twitterId: string;
  username: string;
  displayName: string;
  profileImageUrl?: string;
  pallyPoints: number;
  wagerPoints: number;
  totalPredictions: number;
  correctPredictions: number;
  currentStreak: number;
  bestStreak: number;
  createdAt: string;
}

export interface QuestionOption {
  id: string;
  text: string;
  imageUrl?: string | null;
}

export interface Question {
  id: string;
  text: string;
  description?: string;
  options: QuestionOption[];
  category: string;
  difficulty: string;
  status: 'active' | 'closed' | 'resolved';
  correctAnswer?: string;
  expiresAt: string;
  resolvedAt?: string;
  imageUrl?: string | null;
  createdAt: string;
}

export interface Vote {
  id: string;
  oddsAtVote?: number;
  userId: string;
  questionId: string;
  selectedOption: string;
  wagerAmount: number;
  createdAt: string;
}

export interface QuestionStats {
  totalBets: number;
  totalAmount: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  profileImageUrl?: string;
  wagerPoints: number;
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
}

export interface ActivityItem {
  id: string;
  username: string;
  displayName: string;
  profileImageUrl?: string;
  selectedOption: string;
  wagerAmount: number;
  createdAt: string;
}
