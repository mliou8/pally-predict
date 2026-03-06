import { useQuery } from '@tanstack/react-query';
import { API_ENDPOINTS } from '../constants/api';
import { LeaderboardEntry } from '../types';

export type TimePeriod = 'daily' | 'weekly' | 'allTime';

export function useLeaderboard(period: TimePeriod = 'weekly') {
  return useQuery<LeaderboardEntry[]>({
    queryKey: ['leaderboard', period],
    queryFn: async () => {
      const res = await fetch(`${API_ENDPOINTS.leaderboard}?period=${period}`);
      if (!res.ok) throw new Error('Failed to fetch leaderboard');
      return res.json();
    },
  });
}
