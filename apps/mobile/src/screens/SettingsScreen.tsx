import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import Constants from 'expo-constants'
import { useWallet } from '../hooks/useWallet'
import { useBalance } from '../hooks/useBalance'
import { WalletButton } from '../components/WalletButton'
import { truncateAddress, formatSol } from '@predictsol/shared'
import { CLUSTER } from '../constants'
import { colors, spacing, radius } from '../components/ui/theme'

export const SettingsScreen = () => {
  const { walletAddress, isConnected, disconnect } = useWallet()
  const { balance } = useBalance()

  const appVersion = Constants.expoConfig?.version ?? '1.0.0'

  const copyAddress = async () => {
    if (walletAddress) {
      await Clipboard.setStringAsync(walletAddress)
      Alert.alert('Copied', 'Wallet address copied to clipboard')
    }
  }

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Wallet',
      'Are you sure you want to disconnect your wallet?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disconnect', style: 'destructive', onPress: disconnect },
      ]
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.content}>
        {isConnected && walletAddress ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Wallet</Text>

            <TouchableOpacity style={styles.card} onPress={copyAddress}>
              <View>
                <Text style={styles.cardLabel}>Address</Text>
                <Text style={styles.cardValue}>{truncateAddress(walletAddress)}</Text>
              </View>
              <Text style={styles.copyHint}>Tap to copy</Text>
            </TouchableOpacity>

            <View style={styles.card}>
              <Text style={styles.cardLabel}>Balance</Text>
              <Text style={styles.balanceValue}>
                {formatSol(balance * 1_000_000_000)}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.disconnectButton}
              onPress={handleDisconnect}
            >
              <Text style={styles.disconnectButtonText}>Disconnect Wallet</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Wallet</Text>
            <View style={styles.connectContainer}>
              <Text style={styles.connectText}>Connect your wallet to get started</Text>
              <WalletButton />
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Network</Text>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Cluster</Text>
            <View style={styles.networkBadge}>
              <Text style={styles.networkBadgeText}>
                {CLUSTER.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Info</Text>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Version</Text>
            <Text style={styles.cardValue}>{appVersion}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>App Name</Text>
            <Text style={styles.cardValue}>PredictSol</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  cardValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  balanceValue: {
    fontSize: 18,
    color: colors.secondary,
    fontWeight: '600',
  },
  copyHint: {
    fontSize: 12,
    color: colors.primary,
  },
  disconnectButton: {
    backgroundColor: colors.error + '22',
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  disconnectButtonText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
  connectContainer: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  connectText: {
    color: colors.textMuted,
    fontSize: 16,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  networkBadge: {
    backgroundColor: CLUSTER === 'devnet' ? colors.primary + '33' : colors.secondary + '33',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  networkBadgeText: {
    color: CLUSTER === 'devnet' ? colors.primary : colors.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
})
