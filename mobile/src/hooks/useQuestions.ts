import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_ENDPOINTS } from '../constants/api';
import { Question, QuestionStats, Vote, ActivityItem } from '../types';
import { useAuth } from '../contexts/AuthContext';

export function useActiveQuestion() {
  return useQuery<Question>({
    queryKey: ['activeQuestion'],
    queryFn: async () => {
      const res = await fetch(API_ENDPOINTS.questions.active);
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error('Failed to fetch active question');
      }
      return res.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useQuestion(questionId: string | undefined) {
  return useQuery<Question>({
    queryKey: ['question', questionId],
    queryFn: async () => {
      if (!questionId) return null;
      const res = await fetch(API_ENDPOINTS.questions.byId(questionId));
      if (!res.ok) throw new Error('Failed to fetch question');
      return res.json();
    },
    enabled: !!questionId,
  });
}

export function useRecentQuestions() {
  return useQuery<Question[]>({
    queryKey: ['recentQuestions'],
    queryFn: async () => {
      const res = await fetch(API_ENDPOINTS.questions.recent);
      if (!res.ok) throw new Error('Failed to fetch recent questions');
      return res.json();
    },
  });
}

export function useQuestionStats(questionId: string | undefined) {
  return useQuery<QuestionStats>({
    queryKey: ['questionStats', questionId],
    queryFn: async () => {
      if (!questionId) return null;
      const res = await fetch(API_ENDPOINTS.questions.liveStats(questionId));
      if (!res.ok) throw new Error('Failed to fetch question stats');
      return res.json();
    },
    enabled: !!questionId,
    refetchInterval: 5000, // Refresh every 5 seconds
  });
}

export function useQuestionActivity(questionId: string | undefined) {
  return useQuery<ActivityItem[]>({
    queryKey: ['questionActivity', questionId],
    queryFn: async () => {
      if (!questionId) return [];
      const res = await fetch(API_ENDPOINTS.questions.activity(questionId));
      if (!res.ok) throw new Error('Failed to fetch activity');
      return res.json();
    },
    enabled: !!questionId,
    refetchInterval: 10000, // Refresh every 10 seconds
  });
}

export function useMyVote(questionId: string | undefined) {
  const { user } = useAuth();

  return useQuery<Vote | null>({
    queryKey: ['myVote', questionId],
    queryFn: async () => {
      if (!questionId || !user) return null;
      const res = await fetch(API_ENDPOINTS.votes.myVote(questionId), {
        headers: {
          'x-user-id': user.id,
        },
      });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Failed to fetch vote');
      return res.json();
    },
    enabled: !!questionId && !!user,
  });
}

export function useSubmitVote() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      questionId,
      selectedOption,
      wagerAmount,
    }: {
      questionId: string;
      selectedOption: string;
      wagerAmount: number;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const res = await fetch(API_ENDPOINTS.votes.submit, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          questionId,
          selectedOption,
          wagerAmount,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to submit vote');
      }

      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['questionStats', variables.questionId] });
      queryClient.invalidateQueries({ queryKey: ['myVote', variables.questionId] });
      queryClient.invalidateQueries({ queryKey: ['questionActivity', variables.questionId] });
      refreshUser();
    },
  });
}
