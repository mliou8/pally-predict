import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { useWallet } from '../hooks/useWallet'
import { truncateAddress } from '@predictsol/shared'
import { colors, spacing, radius } from './ui/theme'

export const WalletButton = () => {
  const { walletAddress, isConnected, isConnecting, connect, disconnect, error } = useWallet()

  if (isConnecting) {
    return (
      <View style={styles.container}>
        <View style={styles.connectingButton}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.connectingText}>Connecting...</Text>
        </View>
      </View>
    )
  }

  if (isConnected && walletAddress) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.connectedButton} onPress={disconnect}>
          <Text style={styles.addressText}>{truncateAddress(walletAddress)}</Text>
          <Text style={styles.disconnectIcon}>×</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.connectButton} onPress={connect}>
        <Text style={styles.connectButtonText}>Connect Wallet</Text>
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
  },
  connectButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  connectingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  connectingText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  connectedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: spacing.sm,
  },
  addressText: {
    color: colors.text,
    fontSize: 14,
    fontFamily: 'monospace',
  },
  disconnectIcon: {
    color: colors.textMuted,
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: spacing.xs,
    maxWidth: 200,
    textAlign: 'right',
  },
})
