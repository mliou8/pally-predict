import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { API_ENDPOINTS } from '../constants/api';
import { LeaderboardEntry } from '../types';
import { useAuth } from '../contexts/AuthContext';

type TimePeriod = 'daily' | 'weekly' | 'allTime';

const TIME_PERIODS: { key: TimePeriod; label: string }[] = [
  { key: 'daily', label: 'Today' },
  { key: 'weekly', label: 'Week' },
  { key: 'allTime', label: 'All Time' },
];

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<TimePeriod>('weekly');

  const { data: leaderboard, isLoading, refetch } = useQuery<LeaderboardEntry[]>({
    queryKey: ['leaderboard', period],
    queryFn: async () => {
      const res = await fetch(`${API_ENDPOINTS.leaderboard}?period=${period}`);
      if (!res.ok) throw new Error('Failed to fetch leaderboard');
      return res.json();
    },
  });

  const renderPodium = () => {
    if (!leaderboard || leaderboard.length < 3) return null;

    const [first, second, third] = leaderboard;

    return (
      <View style={styles.podium}>
        {/* Second Place */}
        <View style={[styles.podiumItem, styles.podiumSecond]}>
          <View style={[styles.podiumBadge, { backgroundColor: '#C0C0C0' }]}>
            <Text style={styles.podiumRank}>2</Text>
          </View>
          <View style={styles.podiumAvatar}>
            {second.profileImageUrl ? (
              <Image source={{ uri: second.profileImageUrl }} style={styles.podiumAvatarImage} />
            ) : (
              <View style={[styles.podiumAvatarPlaceholder, { backgroundColor: '#C0C0C0' }]}>
                <Text style={styles.podiumAvatarText}>{second.username[0]?.toUpperCase()}</Text>
              </View>
            )}
          </View>
          <Text style={styles.podiumUsername} numberOfLines={1}>
            {second.username}
          </Text>
          <Text style={styles.podiumPoints}>{second.wagerPoints.toLocaleString()} WP</Text>
          <View style={[styles.podiumBar, styles.podiumBarSecond]} />
        </View>

        {/* First Place */}
        <View style={[styles.podiumItem, styles.podiumFirst]}>
          <View style={[styles.podiumBadge, { backgroundColor: '#FFD700' }]}>
            <Text style={styles.podiumRank}>1</Text>
          </View>
          <View style={styles.podiumAvatar}>
            {first.profileImageUrl ? (
              <Image source={{ uri: first.profileImageUrl }} style={styles.podiumAvatarImage} />
            ) : (
              <View style={[styles.podiumAvatarPlaceholder, { backgroundColor: '#FFD700' }]}>
                <Text style={styles.podiumAvatarText}>{first.username[0]?.toUpperCase()}</Text>
              </View>
            )}
          </View>
          <Text style={styles.podiumUsername} numberOfLines={1}>
            {first.username}
          </Text>
          <Text style={styles.podiumPoints}>{first.wagerPoints.toLocaleString()} WP</Text>
          <View style={[styles.podiumBar, styles.podiumBarFirst]} />
        </View>

        {/* Third Place */}
        <View style={[styles.podiumItem, styles.podiumThird]}>
          <View style={[styles.podiumBadge, { backgroundColor: '#CD7F32' }]}>
            <Text style={styles.podiumRank}>3</Text>
          </View>
          <View style={styles.podiumAvatar}>
            {third.profileImageUrl ? (
              <Image source={{ uri: third.profileImageUrl }} style={styles.podiumAvatarImage} />
            ) : (
              <View style={[styles.podiumAvatarPlaceholder, { backgroundColor: '#CD7F32' }]}>
                <Text style={styles.podiumAvatarText}>{third.username[0]?.toUpperCase()}</Text>
              </View>
            )}
          </View>
          <Text style={styles.podiumUsername} numberOfLines={1}>
            {third.username}
          </Text>
          <Text style={styles.podiumPoints}>{third.wagerPoints.toLocaleString()} WP</Text>
          <View style={[styles.podiumBar, styles.podiumBarThird]} />
        </View>
      </View>
    );
  };

  const renderItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    if (index < 3) return null; // Skip top 3, shown in podium

    const isCurrentUser = item.userId === user?.id;

    return (
      <View style={[styles.row, isCurrentUser && styles.rowCurrentUser]}>
        <Text style={styles.rank}>{item.rank}</Text>
        <View style={styles.avatarContainer}>
          {item.profileImageUrl ? (
            <Image source={{ uri: item.profileImageUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{item.username[0]?.toUpperCase()}</Text>
            </View>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.stats}>
            {item.accuracy.toFixed(1)}% accuracy
          </Text>
        </View>
        <View style={styles.pointsContainer}>
          <Text style={styles.points}>{item.wagerPoints.toLocaleString()}</Text>
          <Text style={styles.pointsLabel}>WP</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Period Tabs */}
      <View style={styles.tabs}>
        {TIME_PERIODS.map((p) => (
          <TouchableOpacity
            key={p.key}
            style={[styles.tab, period === p.key && styles.tabActive]}
            onPress={() => setPeriod(p.key)}
          >
            <Text style={[styles.tabText, period === p.key && styles.tabTextActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.dark.accent} />
        </View>
      ) : (
        <FlatList
          data={leaderboard}
          renderItem={renderItem}
          keyExtractor={(item) => item.userId}
          ListHeaderComponent={renderPodium}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={Colors.dark.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No rankings yet</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  tabs: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.dark.accent,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
  },
  tabTextActive: {
    color: '#000',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: 24,
    paddingTop: 40,
  },
  podiumItem: {
    alignItems: 'center',
    width: 100,
  },
  podiumFirst: {
    marginBottom: 40,
  },
  podiumSecond: {
    marginBottom: 20,
  },
  podiumThird: {
    marginBottom: 10,
  },
  podiumBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  podiumRank: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  podiumAvatar: {
    marginBottom: 8,
  },
  podiumAvatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  podiumAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumAvatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  podiumUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  podiumPoints: {
    fontSize: 12,
    color: Colors.dark.accent,
    fontWeight: '600',
    marginBottom: 8,
  },
  podiumBar: {
    width: 80,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  podiumBarFirst: {
    height: 80,
    backgroundColor: '#FFD700',
  },
  podiumBarSecond: {
    height: 60,
    backgroundColor: '#C0C0C0',
  },
  podiumBarThird: {
    height: 40,
    backgroundColor: '#CD7F32',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  rowCurrentUser: {
    borderWidth: 1,
    borderColor: Colors.dark.accent,
  },
  rank: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark.textMuted,
    width: 30,
    textAlign: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 2,
  },
  stats: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  points: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  pointsLabel: {
    fontSize: 10,
    color: Colors.dark.accent,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.dark.textMuted,
  },
});
