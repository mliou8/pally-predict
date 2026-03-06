import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Colors, { OPTION_COLORS } from '../constants/colors';
import { API_ENDPOINTS } from '../constants/api';
import { Question } from '../types';

type QuestionDetailRouteProp = RouteProp<{ QuestionDetail: { questionId: string } }, 'QuestionDetail'>;

export default function QuestionDetailScreen() {
  const route = useRoute<QuestionDetailRouteProp>();
  const { questionId } = route.params;

  const { data: question, isLoading } = useQuery<Question>({
    queryKey: ['question', questionId],
    queryFn: async () => {
      const res = await fetch(API_ENDPOINTS.questions.byId(questionId));
      if (!res.ok) throw new Error('Failed to fetch question');
      return res.json();
    },
  });

  if (isLoading || !question) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const isResolved = question.status === 'resolved';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Question Image */}
      {question.imageUrl && (
        <Image source={{ uri: question.imageUrl }} style={styles.image} />
      )}

      {/* Status Badge */}
      <View style={[styles.statusBadge, isResolved && styles.statusResolved]}>
        <Ionicons
          name={isResolved ? 'checkmark-circle' : 'time'}
          size={14}
          color={isResolved ? '#22C55E' : Colors.dark.textMuted}
        />
        <Text style={[styles.statusText, isResolved && styles.statusTextResolved]}>
          {isResolved ? 'Resolved' : question.status === 'active' ? 'Active' : 'Closed'}
        </Text>
      </View>

      {/* Category */}
      <View style={styles.categoryBadge}>
        <Text style={styles.categoryText}>{question.category}</Text>
      </View>

      {/* Question Text */}
      <Text style={styles.questionText}>{question.text}</Text>

      {question.description && (
        <Text style={styles.description}>{question.description}</Text>
      )}

      {/* Options */}
      <View style={styles.options}>
        {question.options.map((option, index) => {
          const optionIndex = option.id.charCodeAt(0) - 65;
          const colors = OPTION_COLORS[optionIndex % OPTION_COLORS.length];
          const isCorrect = question.correctAnswer === option.id;

          return (
            <View
              key={option.id}
              style={[
                styles.optionCard,
                isResolved && isCorrect && { backgroundColor: 'rgba(34, 197, 94, 0.15)' },
              ]}
            >
              <View style={[styles.optionBadge, { backgroundColor: colors.bg }]}>
                <Text style={[styles.optionBadgeText, { color: colors.text }]}>
                  {option.id}
                </Text>
              </View>
              <Text style={styles.optionText}>{option.text}</Text>
              {isResolved && isCorrect && (
                <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
              )}
            </View>
          );
        })}
      </View>

      {/* Resolution Info */}
      {isResolved && question.correctAnswer && (
        <View style={styles.resolutionInfo}>
          <Ionicons name="trophy" size={24} color="#FFD700" />
          <Text style={styles.resolutionText}>
            Correct answer: {question.correctAnswer}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    padding: 16,
  },
  loadingText: {
    color: Colors.dark.textMuted,
    textAlign: 'center',
    marginTop: 40,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: Colors.dark.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  statusResolved: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.textMuted,
  },
  statusTextResolved: {
    color: '#22C55E',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.dark.accentDim,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.accent,
    textTransform: 'uppercase',
  },
  questionText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.dark.text,
    lineHeight: 32,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  options: {
    gap: 12,
    marginBottom: 24,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  optionBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: Colors.dark.text,
  },
  resolutionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  resolutionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
  },
});
