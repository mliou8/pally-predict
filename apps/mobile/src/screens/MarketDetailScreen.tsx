import React, { useRef, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { useRoute, RouteProp } from '@react-navigation/native'
import BottomSheet from '@gorhom/bottom-sheet'
import { useMarket } from '../hooks/useMarkets'
import { OddsBar } from '../components/OddsBar'
import { BetBottomSheet } from '../components/BetBottomSheet'
import { colors, spacing, radius } from '../components/ui/theme'
import { formatSol } from '@predictsol/shared'

type RootStackParamList = {
  MarketDetail: { marketId: string }
}

type MarketDetailRouteProp = RouteProp<RootStackParamList, 'MarketDetail'>

export const MarketDetailScreen = () => {
  const route = useRoute<MarketDetailRouteProp>()
  const { marketId } = route.params
  const { market, isLoading, error } = useMarket(marketId)
  const bottomSheetRef = useRef<BottomSheet>(null)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)

  const handleBetPress = (optionLabel: string) => {
    setSelectedOption(optionLabel)
    bottomSheetRef.current?.expand()
  }

  const handleCloseSheet = () => {
    bottomSheetRef.current?.close()
    setSelectedOption(null)
  }

  const getTimeRemaining = (resolvesAt: number) => {
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (error || !market) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load market</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>{market.title}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Time Remaining</Text>
            <Text style={styles.metaValue}>{getTimeRemaining(market.resolvesAt)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Total Pool</Text>
            <Text style={styles.metaValue}>{formatSol(market.totalPoolLamports)}</Text>
          </View>
        </View>

        {market.description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionLabel}>Description</Text>
            <Text style={styles.descriptionText}>{market.description}</Text>
          </View>
        )}

        <View style={styles.oddsContainer}>
          <Text style={styles.sectionTitle}>Current Odds</Text>
          <OddsBar options={market.options} />
        </View>

        <View style={styles.optionsContainer}>
          <Text style={styles.sectionTitle}>Place Your Bet</Text>
          {market.options.map((option, index) => (
            <TouchableOpacity
              key={option.label}
              style={[
                styles.optionButton,
                index === 0 && styles.optionButtonPrimary,
                index === 1 && styles.optionButtonSecondary,
              ]}
              onPress={() => handleBetPress(option.label)}
            >
              <View>
                <Text style={styles.optionLabel}>{option.label}</Text>
                <Text style={styles.optionOdds}>{option.oddsPercent}% odds</Text>
              </View>
              <Text style={styles.betButtonText}>Bet</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>Market Address</Text>
          <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="middle">
            {market.onChainAddress}
          </Text>
        </View>
      </ScrollView>

      <BetBottomSheet
        ref={bottomSheetRef}
        market={market}
        selectedOption={selectedOption}
        onClose={handleCloseSheet}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  metaItem: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginHorizontal: spacing.xs,
  },
  metaLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  metaValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  descriptionContainer: {
    marginBottom: spacing.lg,
  },
  descriptionLabel: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  descriptionText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  oddsContainer: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  optionsContainer: {
    marginBottom: spacing.lg,
  },
  optionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.textMuted,
  },
  optionButtonPrimary: {
    borderLeftColor: colors.primary,
  },
  optionButtonSecondary: {
    borderLeftColor: colors.secondary,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  optionOdds: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  betButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  infoValue: {
    fontSize: 14,
    color: colors.text,
    fontFamily: 'monospace',
  },
})
