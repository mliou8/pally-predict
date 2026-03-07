import React from 'react'
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useMarkets } from '../hooks/useMarkets'
import { useSeeker } from '../hooks/useSeeker'
import { MarketCard } from '../components/MarketCard'
import { SeekerBadge } from '../components/SeekerBadge'
import { WalletButton } from '../components/WalletButton'
import { colors, spacing } from '../components/ui/theme'
import type { Market } from '@predictsol/shared'

type RootStackParamList = {
  Home: undefined
  MarketDetail: { marketId: string }
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>

export const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp>()
  const { markets, isLoading, isRefetching, refetch } = useMarkets('open')
  const { isSeekerDevice } = useSeeker()

  const handleMarketPress = (market: Market) => {
    navigation.navigate('MarketDetail', { marketId: market.id })
  }

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No markets yet</Text>
      <Text style={styles.emptySubtitle}>Be the first to create one!</Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => navigation.navigate('Create' as any)}
      >
        <Text style={styles.createButtonText}>Create Market</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Markets</Text>
          {isSeekerDevice && <SeekerBadge />}
        </View>
        <WalletButton />
      </View>

      <FlatList
        data={markets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MarketCard market={item} onPress={() => handleMarketPress(item)} />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        showsVerticalScrollIndicator={false}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
