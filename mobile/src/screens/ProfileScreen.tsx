import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { API_ENDPOINTS, API_BASE_URL } from '../constants/api';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const { publicKey, isConnected, connect, disconnect } = useWallet();
  const queryClient = useQueryClient();

  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.username || '');

  const usernameMutation = useMutation({
    mutationFn: async (username: string) => {
      const res = await fetch(API_ENDPOINTS.users.setUsername, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({ username }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update username');
      }
      return res.json();
    },
    onSuccess: () => {
      refreshUser();
      setIsEditingUsername(false);
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const handleSaveUsername = () => {
    if (newUsername.trim() && newUsername !== user?.username) {
      usernameMutation.mutate(newUsername.trim());
    } else {
      setIsEditingUsername(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const accuracy = user && user.totalPredictions > 0
    ? (user.correctPredictions / user.totalPredictions) * 100
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {user?.profileImageUrl ? (
            <Image source={{ uri: user.profileImageUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{user?.username[0]?.toUpperCase()}</Text>
            </View>
          )}
        </View>

        {isEditingUsername ? (
          <View style={styles.usernameEdit}>
            <TextInput
              style={styles.usernameInput}
              value={newUsername}
              onChangeText={setNewUsername}
              autoFocus
              maxLength={20}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={handleSaveUsername} disabled={usernameMutation.isPending}>
              {usernameMutation.isPending ? (
                <ActivityIndicator size="small" color={Colors.dark.accent} />
              ) : (
                <Ionicons name="checkmark-circle" size={28} color="#22C55E" />
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsEditingUsername(false)}>
              <Ionicons name="close-circle" size={28} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.usernameRow}
            onPress={() => {
              setNewUsername(user?.username || '');
              setIsEditingUsername(true);
            }}
          >
            <Text style={styles.username}>@{user?.username}</Text>
            <Ionicons name="pencil" size={16} color={Colors.dark.textMuted} />
          </TouchableOpacity>
        )}

        <Text style={styles.displayName}>{user?.displayName}</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{user?.wagerPoints?.toLocaleString() ?? 0}</Text>
          <Text style={styles.statLabel}>Wager Points</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{user?.pallyPoints?.toLocaleString() ?? 0}</Text>
          <Text style={styles.statLabel}>Pally Points</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{accuracy.toFixed(1)}%</Text>
          <Text style={styles.statLabel}>Accuracy</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{user?.totalPredictions ?? 0}</Text>
          <Text style={styles.statLabel}>Predictions</Text>
        </View>
      </View>

      {/* Streak Section */}
      <View style={styles.streakSection}>
        <View style={styles.streakItem}>
          <Ionicons name="flame" size={24} color={Colors.dark.accent} />
          <View>
            <Text style={styles.streakValue}>{user?.currentStreak ?? 0}</Text>
            <Text style={styles.streakLabel}>Current Streak</Text>
          </View>
        </View>
        <View style={styles.streakDivider} />
        <View style={styles.streakItem}>
          <Ionicons name="trophy" size={24} color="#FFD700" />
          <View>
            <Text style={styles.streakValue}>{user?.bestStreak ?? 0}</Text>
            <Text style={styles.streakLabel}>Best Streak</Text>
          </View>
        </View>
      </View>

      {/* Wallet Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Solana Wallet</Text>
        {isConnected ? (
          <View style={styles.walletConnected}>
            <View style={styles.walletInfo}>
              <Ionicons name="wallet" size={20} color="#22C55E" />
              <Text style={styles.walletAddress}>
                {publicKey?.toBase58().slice(0, 4)}...{publicKey?.toBase58().slice(-4)}
              </Text>
            </View>
            <TouchableOpacity style={styles.disconnectButton} onPress={disconnect}>
              <Text style={styles.disconnectText}>Disconnect</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.connectButton} onPress={connect}>
            <Ionicons name="wallet-outline" size={20} color={Colors.dark.accent} />
            <Text style={styles.connectText}>Connect Wallet</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      {/* App Version */}
      <Text style={styles.version}>Pally Predict v1.0.0</Text>
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
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark.accent,
  },
  usernameEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  usernameInput: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark.text,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.accent,
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 150,
  },
  displayName: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  streakSection: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  streakItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakDivider: {
    width: 1,
    backgroundColor: Colors.dark.border,
    marginHorizontal: 16,
  },
  streakValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  streakLabel: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  walletConnected: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletAddress: {
    fontSize: 14,
    color: Colors.dark.text,
    fontFamily: 'monospace',
  },
  disconnectButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  disconnectText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  connectButton: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  connectText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.accent,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginTop: 24,
  },
});
