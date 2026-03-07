import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { MarketOption } from '@predictsol/shared'
import { colors, spacing, radius } from './ui/theme'

type OddsBarProps = {
  options: MarketOption[]
}

const SEGMENT_COLORS = [
  colors.primary,   // First option: purple
  colors.secondary, // Second option: green
  '#6B7280',        // Third and beyond: grey
  '#4B5563',
  '#374151',
  '#1F2937',
]

export const OddsBar = ({ options }: OddsBarProps) => {
  const totalOdds = options.reduce((sum, o) => sum + o.oddsPercent, 0)

  return (
    <View>
      <View style={styles.bar}>
        {options.map((option, index) => {
          const widthPercent = totalOdds > 0 ? (option.oddsPercent / totalOdds) * 100 : 100 / options.length
          const color = SEGMENT_COLORS[index] ?? SEGMENT_COLORS[SEGMENT_COLORS.length - 1]

          return (
            <View
              key={option.label}
              style={[
                styles.segment,
                {
                  flex: widthPercent,
                  backgroundColor: color,
                },
                index === 0 && styles.segmentFirst,
                index === options.length - 1 && styles.segmentLast,
              ]}
            />
          )
        })}
      </View>

      <View style={styles.labels}>
        {options.map((option, index) => {
          const color = SEGMENT_COLORS[index] ?? SEGMENT_COLORS[SEGMENT_COLORS.length - 1]

          return (
            <View key={option.label} style={styles.labelContainer}>
              <View style={[styles.labelDot, { backgroundColor: color }]} />
              <Text style={styles.labelText}>{option.label}</Text>
              <Text style={styles.percentText}>{option.oddsPercent}%</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: radius.full,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },
  segment: {
    height: '100%',
  },
  segmentFirst: {
    borderTopLeftRadius: radius.full,
    borderBottomLeftRadius: radius.full,
  },
  segmentLast: {
    borderTopRightRadius: radius.full,
    borderBottomRightRadius: radius.full,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  labelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  labelText: {
    fontSize: 12,
    color: colors.text,
  },
  percentText: {
    fontSize: 12,
    color: colors.textMuted,
  },
})
