import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Colors, { OPTION_COLORS } from '../constants/colors';
import { API_ENDPOINTS } from '../constants/api';
import { Question, QuestionStats, Vote } from '../types';
import { useAuth } from '../contexts/AuthContext';
import AnswerCard from '../components/AnswerCard';
import WagerSlider from '../components/WagerSlider';

export default function PlayScreen() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [wagerAmount, setWagerAmount] = useState(100);
  const [isLocked, setIsLocked] = useState(false);

  // Fetch active question
  const { data: question, isLoading: questionLoading, refetch } = useQuery<Question>({
    queryKey: ['activeQuestion'],
    queryFn: async () => {
      const res = await fetch(API_ENDPOINTS.questions.active);
      if (!res.ok) throw new Error('Failed to fetch question');
      return res.json();
    },
    refetchInterval: 30000,
  });

  // Fetch question stats
  const { data: stats } = useQuery<QuestionStats>({
    queryKey: ['questionStats', question?.id],
    queryFn: async () => {
      if (!question?.id) return null;
      const res = await fetch(API_ENDPOINTS.questions.liveStats(question.id));
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
    enabled: !!question?.id,
    refetchInterval: 5000,
  });

  // Fetch user's existing vote
  const { data: existingVote } = useQuery<Vote | null>({
    queryKey: ['myVote', question?.id],
    queryFn: async () => {
      if (!question?.id || !user) return null;
      const res = await fetch(API_ENDPOINTS.votes.myVote(question.id), {
        headers: {
          'x-user-id': user.id,
        },
      });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Failed to fetch vote');
      return res.json();
    },
    enabled: !!question?.id && !!user,
  });

  // Submit vote mutation
  const voteMutation = useMutation({
    mutationFn: async () => {
      if (!question || !selectedOption || !user) return;
      const res = await fetch(API_ENDPOINTS.votes.submit, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          questionId: question.id,
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
    onSuccess: () => {
      setIsLocked(true);
      queryClient.invalidateQueries({ queryKey: ['questionStats'] });
      queryClient.invalidateQueries({ queryKey: ['myVote'] });
      refreshUser();
    },
  });

  // Set locked state if already voted
  useEffect(() => {
    if (existingVote) {
      setSelectedOption(existingVote.selectedOption);
      setWagerAmount(existingVote.wagerAmount);
      setIsLocked(true);
    } else {
      setIsLocked(false);
      setSelectedOption(null);
    }
  }, [existingVote, question?.id]);

  const handleSubmit = () => {
    if (selectedOption && !isLocked) {
      voteMutation.mutate();
    }
  };

  // Calculate time remaining
  const getTimeRemaining = () => {
    if (!question?.expiresAt) return '';
    const now = new Date();
    const expires = new Date(question.expiresAt);
    const diff = expires.getTime() - now.getTime();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (questionLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.dark.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!question) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="hourglass-outline" size={64} color={Colors.dark.textMuted} />
          <Text style={styles.emptyTitle}>No Active Question</Text>
          <Text style={styles.emptyText}>Check back soon for the next prediction challenge!</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={questionLoading}
            onRefresh={refetch}
            tintColor={Colors.dark.accent}
          />
        }
      >
        {/* Header with stats */}
        <View style={styles.header}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Prize Pool</Text>
            <Text style={styles.statValue}>
              {stats?.totalAmount ? Math.round(stats.totalAmount).toLocaleString() : '0'} WP
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Players</Text>
            <Text style={styles.statValue}>
              {stats?.totalBets?.toLocaleString() ?? '0'}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Time Left</Text>
            <Text style={[styles.statValue, styles.timeValue]}>{getTimeRemaining()}</Text>
          </View>
        </View>

        {/* Question Card */}
        <View style={styles.questionCard}>
          {question.imageUrl && (
            <Image source={{ uri: question.imageUrl }} style={styles.questionImage} />
          )}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{question.category}</Text>
          </View>
          <Text style={styles.questionText}>{question.text}</Text>
          {question.description && (
            <Text style={styles.questionDescription}>{question.description}</Text>
          )}
        </View>

        {/* Answer Options */}
        <View style={styles.options}>
          {question.options.map((option, index) => (
            <AnswerCard
              key={option.id}
              text={option.text}
              optionId={option.id}
              index={index}
              isSelected={selectedOption === option.id}
              isLocked={isLocked}
              onPress={() => setSelectedOption(option.id)}
              imageUrl={option.imageUrl}
            />
          ))}
        </View>

        {/* Wager Section */}
        {!isLocked && selectedOption && (
          <View style={styles.wagerSection}>
            <WagerSlider
              value={wagerAmount}
              onChange={setWagerAmount}
              maxValue={user?.wagerPoints ?? 1000}
            />
          </View>
        )}

        {/* Submit Button */}
        {!isLocked && (
          <TouchableOpacity
            style={[
              styles.submitButton,
              !selectedOption && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!selectedOption || voteMutation.isPending}
          >
            {voteMutation.isPending ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>
                  Lock In Prediction
                </Text>
                <Text style={styles.submitButtonWager}>
                  {wagerAmount} WP
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Locked State */}
        {isLocked && (
          <View style={styles.lockedBanner}>
            <Ionicons name="lock-closed" size={20} color="#22C55E" />
            <Text style={styles.lockedText}>
              Prediction locked! You wagered {existingVote?.wagerAmount ?? wagerAmount} WP on {selectedOption}
            </Text>
          </View>
        )}

        {/* Error Display */}
        {voteMutation.isError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>
              {voteMutation.error?.message || 'Failed to submit vote'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.dark.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  timeValue: {
    color: Colors.dark.accent,
  },
  questionCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  questionImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 16,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.dark.accentDim,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.accent,
    textTransform: 'uppercase',
  },
  questionText: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.dark.text,
    lineHeight: 30,
  },
  questionDescription: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginTop: 12,
    lineHeight: 20,
  },
  options: {
    marginBottom: 20,
  },
  wagerSection: {
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: Colors.dark.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.dark.surfaceLight,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  submitButtonWager: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.6)',
  },
  lockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  lockedText: {
    flex: 1,
    fontSize: 14,
    color: '#22C55E',
    fontWeight: '500',
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
  },
});
