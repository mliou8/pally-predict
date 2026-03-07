import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Market, formatSol } from '@predictsol/shared'
import { OddsBar } from './OddsBar'
import { SeekerBadge } from './SeekerBadge'
import { colors, spacing, radius } from './ui/theme'

type MarketCardProps = {
  market: Market
  onPress: () => void
}

export const MarketCard = ({ market, onPress }: MarketCardProps) => {
  const getTimeRemaining = (resolvesAt: number): string => {
    const now = Date.now()
    const diff = resolvesAt - now
    if (diff <= 0) return 'Ended'

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) return `${days}d ${hours}h left`
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    if (hours > 0) return `${hours}h ${minutes}m left`
    return `${minutes}m left`
  }

  // Show top 2 options in the card
  const topOptions = market.options.slice(0, 2)

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>
          {market.title}
        </Text>
        {market.seekerExclusive && (
          <View style={styles.seekerBadgeContainer}>
            <View style={styles.seekerBonus}>
              <Text style={styles.seekerBonusText}>Seeker Bonus</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Time</Text>
          <Text style={styles.metaValue}>{getTimeRemaining(market.resolvesAt)}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Pool</Text>
          <Text style={styles.metaValue}>{formatSol(market.totalPoolLamports)}</Text>
        </View>
      </View>

      <View style={styles.oddsContainer}>
        <OddsBar options={topOptions} />
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 22,
  },
  seekerBadgeContainer: {
    marginLeft: spacing.sm,
  },
  seekerBonus: {
    backgroundColor: colors.secondary + '33',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  seekerBonusText: {
    color: colors.secondary,
    fontSize: 10,
    fontWeight: '600',
  },
  meta: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  metaItem: {},
  metaLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  oddsContainer: {
    marginTop: spacing.sm,
  },
})
