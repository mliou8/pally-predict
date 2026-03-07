import React, { useState } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native'
import { useWallet } from '../hooks/useWallet'
import { useBets } from '../hooks/useBets'
import { useMarkets } from '../hooks/useMarkets'
import { WalletButton } from '../components/WalletButton'
import { formatSol, estimatedPayout, Bet, Market } from '@predictsol/shared'
import { colors, spacing, radius } from '../components/ui/theme'

type TabType = 'active' | 'settled'

export const PortfolioScreen = () => {
  const { isConnected } = useWallet()
  const { bets, isLoading, isRefetching, refetch } = useBets()
  const { markets } = useMarkets('open')
  const { markets: resolvedMarkets } = useMarkets('resolved')
  const [activeTab, setActiveTab] = useState<TabType>('active')

  const allMarkets = [...markets, ...resolvedMarkets]

  const getMarketForBet = (bet: Bet): Market | undefined => {
    return allMarkets.find((m) => m.id === bet.marketId)
  }

  const activeBets = bets.filter((bet) => {
    const market = getMarketForBet(bet)
    return market?.status === 'open'
  })

  const settledBets = bets.filter((bet) => {
    const market = getMarketForBet(bet)
    return market?.status === 'resolved'
  })

  const displayBets = activeTab === 'active' ? activeBets : settledBets

  const isWinner = (bet: Bet): boolean => {
    const market = getMarketForBet(bet)
    return market?.resolvedOption === bet.option
  }

  if (!isConnected) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Portfolio</Text>
        </View>
        <View style={styles.connectPrompt}>
          <Text style={styles.connectText}>Connect your wallet to view your bets</Text>
          <View style={styles.walletButtonContainer}>
            <WalletButton />
          </View>
        </View>
      </View>
    )
  }

  const renderBetItem = ({ item: bet }: { item: Bet }) => {
    const market = getMarketForBet(bet)
    const option = market?.options.find((o) => o.label === bet.option)
    const payout = option ? estimatedPayout(bet.amountLamports, option.oddsPercent) : 0
    const won = isWinner(bet)

    return (
      <View style={styles.betCard}>
        <View style={styles.betHeader}>
          <Text style={styles.marketTitle} numberOfLines={2}>
            {market?.title ?? 'Unknown Market'}
          </Text>
          {activeTab === 'settled' && (
            <View style={[styles.badge, won ? styles.winBadge : styles.lossBadge]}>
              <Text style={styles.badgeText}>{won ? 'WIN' : 'LOSS'}</Text>
            </View>
          )}
        </View>

        <View style={styles.betDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Your Pick</Text>
            <Text style={styles.detailValue}>{bet.option}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={styles.detailValue}>{formatSol(bet.amountLamports)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              {activeTab === 'active' ? 'Est. Payout' : 'Payout'}
            </Text>
            <Text style={[styles.detailValue, won && styles.winText]}>
              {won ? formatSol(payout) : activeTab === 'settled' ? '0 SOL' : formatSol(payout)}
            </Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Portfolio</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
            Active ({activeBets.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'settled' && styles.activeTab]}
          onPress={() => setActiveTab('settled')}
        >
          <Text style={[styles.tabText, activeTab === 'settled' && styles.activeTabText]}>
            Settled ({settledBets.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayBets}
        keyExtractor={(item) => `${item.marketId}-${item.txSignature}`}
        renderItem={renderBetItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {activeTab === 'active'
                ? 'No active bets. Start betting on markets!'
                : 'No settled bets yet.'}
            </Text>
          </View>
        }
      />
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
  connectPrompt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  connectText: {
    fontSize: 18,
    color: colors.textMuted,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  walletButtonContainer: {
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: colors.textMuted,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  listContent: {
    padding: spacing.md,
  },
  betCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  betHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  marketTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginRight: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  winBadge: {
    backgroundColor: colors.success + '33',
  },
  lossBadge: {
    backgroundColor: colors.error + '33',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  betDetails: {
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  detailValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  winText: {
    color: colors.success,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
  },
})
