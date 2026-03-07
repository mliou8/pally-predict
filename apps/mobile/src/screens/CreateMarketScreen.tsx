import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useQueryClient } from '@tanstack/react-query'
import { useWallet } from '../hooks/useWallet'
import { walletService } from '../services/walletService'
import { transactionService } from '../services/transactionService'
import { createApiClient } from '@predictsol/shared'
import { API_BASE_URL } from '../constants'
import { colors, spacing, radius } from '../components/ui/theme'

const apiClient = createApiClient(API_BASE_URL)
const MAX_TITLE_LENGTH = 100
const MIN_OPTIONS = 2
const MAX_OPTIONS = 6

export const CreateMarketScreen = () => {
  const navigation = useNavigation()
  const queryClient = useQueryClient()
  const { walletAddress, isConnected } = useWallet()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [options, setOptions] = useState(['Yes', 'No'])
  const [resolvesAt, setResolvesAt] = useState<Date | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const addOption = () => {
    if (options.length < MAX_OPTIONS) {
      setOptions([...options, ''])
    }
  }

  const removeOption = (index: number) => {
    if (options.length > MIN_OPTIONS) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!title.trim()) {
      newErrors.title = 'Title is required'
    } else if (title.length > MAX_TITLE_LENGTH) {
      newErrors.title = `Title must be ${MAX_TITLE_LENGTH} characters or less`
    }

    const validOptions = options.filter((o) => o.trim())
    if (validOptions.length < MIN_OPTIONS) {
      newErrors.options = `At least ${MIN_OPTIONS} options are required`
    }

    if (!resolvesAt) {
      newErrors.resolvesAt = 'Resolution date is required'
    } else if (resolvesAt.getTime() <= Date.now()) {
      newErrors.resolvesAt = 'Resolution date must be in the future'
    }

    if (!isConnected) {
      newErrors.wallet = 'Please connect your wallet first'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate() || !walletAddress || !resolvesAt) return

    setIsSubmitting(true)
    try {
      const marketId = `market_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      const validOptions = options.filter((o) => o.trim())

      // Build and sign the transaction
      const txBytes = await transactionService.buildCreateMarketTransaction(
        walletAddress,
        marketId,
        title,
        validOptions,
        resolvesAt.getTime()
      )

      // NOTE: Sign and send via MWA
      const txSignature = await walletService.signAndSendTransaction(txBytes)

      // Record the market in the backend
      await apiClient.createMarket({
        title,
        description,
        options: validOptions,
        resolvesAt: resolvesAt.getTime(),
        creatorWallet: walletAddress,
        onChainAddress: marketId, // In production, this would be the actual PDA
        txSignature,
      })

      // Invalidate markets cache
      queryClient.invalidateQueries({ queryKey: ['markets'] })

      Alert.alert('Success', 'Market created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ])
    } catch (error: any) {
      Alert.alert('Error', error?.message ?? 'Failed to create market')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Simple date input - in production, use a DateTimePicker
  const handleDateChange = (text: string) => {
    // Expect format: YYYY-MM-DD HH:mm
    const parsed = new Date(text)
    if (!isNaN(parsed.getTime())) {
      setResolvesAt(parsed)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Create Market</Text>

      {!isConnected && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>Connect your wallet to create a market</Text>
        </View>
      )}

      <View style={styles.field}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Title</Text>
          <Text style={styles.charCount}>
            {title.length}/{MAX_TITLE_LENGTH}
          </Text>
        </View>
        <TextInput
          style={[styles.input, errors.title ? styles.inputError : undefined]}
          value={title}
          onChangeText={setTitle}
          placeholder="Will SOL hit $500 by end of year?"
          placeholderTextColor={colors.textMuted}
          maxLength={MAX_TITLE_LENGTH}
        />
        {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Description (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Add more context about this market..."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Options</Text>
        {options.map((option, index) => (
          <View key={index} style={styles.optionRow}>
            <TextInput
              style={[styles.input, styles.optionInput]}
              value={option}
              onChangeText={(text) => updateOption(index, text)}
              placeholder={`Option ${index + 1}`}
              placeholderTextColor={colors.textMuted}
            />
            {options.length > MIN_OPTIONS && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeOption(index)}
              >
                <Text style={styles.removeButtonText}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        {options.length < MAX_OPTIONS && (
          <TouchableOpacity style={styles.addButton} onPress={addOption}>
            <Text style={styles.addButtonText}>+ Add Option</Text>
          </TouchableOpacity>
        )}
        {errors.options && <Text style={styles.errorText}>{errors.options}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Resolves At</Text>
        <TextInput
          style={[styles.input, errors.resolvesAt ? styles.inputError : undefined]}
          placeholder="YYYY-MM-DD HH:mm"
          placeholderTextColor={colors.textMuted}
          onChangeText={handleDateChange}
        />
        {resolvesAt && (
          <Text style={styles.datePreview}>
            {resolvesAt.toLocaleString()}
          </Text>
        )}
        {errors.resolvesAt && <Text style={styles.errorText}>{errors.resolvesAt}</Text>}
      </View>

      <TouchableOpacity
        style={[styles.submitButton, (!isConnected || isSubmitting) && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={!isConnected || isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Create Market</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  warningBox: {
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  warningText: {
    color: colors.error,
    fontSize: 14,
  },
  field: {
    marginBottom: spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  charCount: {
    fontSize: 12,
    color: colors.textMuted,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: 16,
  },
  inputError: {
    borderColor: colors.error,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  optionInput: {
    flex: 1,
  },
  removeButton: {
    marginLeft: spacing.sm,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
  },
  removeButtonText: {
    color: colors.error,
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderStyle: 'dashed',
  },
  addButtonText: {
    color: colors.primary,
    fontSize: 16,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  datePreview: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: spacing.xs,
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
})
