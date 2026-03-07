import React, { forwardRef, useState, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native'
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import { useQueryClient } from '@tanstack/react-query'
import { Market, formatSol, estimatedPayout, createApiClient } from '@predictsol/shared'
import { useWallet } from '../hooks/useWallet'
import { walletService } from '../services/walletService'
import { transactionService } from '../services/transactionService'
import { API_BASE_URL, MIN_BET_LAMPORTS } from '../constants'
import { colors, spacing, radius } from './ui/theme'

const apiClient = createApiClient(API_BASE_URL)

type BetBottomSheetProps = {
  market: Market | undefined
  selectedOption: string | null
  onClose: () => void
}

export const BetBottomSheet = forwardRef<BottomSheet, BetBottomSheetProps>(
  ({ market, selectedOption, onClose }, ref) => {
    const { walletAddress, isConnected } = useWallet()
    const queryClient = useQueryClient()
    const [amountSol, setAmountSol] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const snapPoints = useMemo(() => ['50%'], [])

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
        />
      ),
      []
    )

    const option = market?.options.find((o) => o.label === selectedOption)
    const amountLamports = Math.floor(parseFloat(amountSol || '0') * 1_000_000_000)
    const isValidAmount = amountLamports >= MIN_BET_LAMPORTS
    const payout = option ? estimatedPayout(amountLamports, option.oddsPercent) : 0

    const handleConfirmBet = async () => {
      if (!market || !selectedOption || !walletAddress || !isValidAmount) return

      setIsSubmitting(true)
      try {
        // Build and sign the transaction
        const txBytes = await transactionService.buildBetTransaction(
          walletAddress,
          market.onChainAddress,
          amountLamports,
          market.id,
          selectedOption
        )

        // NOTE: Sign and send via MWA
        const txSignature = await walletService.signAndSendTransaction(txBytes)

        // Record the bet in the backend
        await apiClient.recordBet({
          marketId: market.id,
          walletAddress,
          option: selectedOption,
          amountLamports,
          txSignature,
        })

        // Invalidate caches
        queryClient.invalidateQueries({ queryKey: ['market', market.id] })
        queryClient.invalidateQueries({ queryKey: ['markets'] })
        queryClient.invalidateQueries({ queryKey: ['bets', walletAddress] })

        Alert.alert('Success', `Bet placed! TX: ${txSignature.slice(0, 16)}...`, [
          { text: 'OK', onPress: onClose },
        ])

        setAmountSol('')
      } catch (error: any) {
        Alert.alert('Error', error?.message ?? 'Failed to place bet', [
          { text: 'Retry', onPress: handleConfirmBet },
          { text: 'Cancel', style: 'cancel' },
        ])
      } finally {
        setIsSubmitting(false)
      }
    }

    const handleClose = () => {
      setAmountSol('')
      onClose()
    }

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onClose={handleClose}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Place Bet</Text>

          {selectedOption && (
            <View style={styles.optionDisplay}>
              <Text style={styles.optionLabel}>Your Pick</Text>
              <Text style={styles.optionValue}>{selectedOption}</Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Amount (SOL)</Text>
            <TextInput
              style={styles.input}
              value={amountSol}
              onChangeText={setAmountSol}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              editable={!isSubmitting}
            />
            {amountSol && !isValidAmount && (
              <Text style={styles.errorText}>
                Minimum bet is {formatSol(MIN_BET_LAMPORTS)}
              </Text>
            )}
          </View>

          <View style={styles.payoutContainer}>
            <Text style={styles.payoutLabel}>Estimated Payout</Text>
            <Text style={styles.payoutValue}>
              {isValidAmount ? formatSol(payout) : '—'}
            </Text>
          </View>

          {!isConnected ? (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                Connect your wallet to place a bet
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.confirmButton,
                (!isValidAmount || isSubmitting) && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirmBet}
              disabled={!isValidAmount || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>Confirm Bet</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </BottomSheet>
    )
  }
)

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: colors.surface,
  },
  handleIndicator: {
    backgroundColor: colors.border,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  optionDisplay: {
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  optionLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  optionValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  payoutContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  payoutLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  payoutValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.secondary,
  },
  warningBox: {
    backgroundColor: colors.error + '22',
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  warningText: {
    color: colors.error,
    fontSize: 14,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
})
