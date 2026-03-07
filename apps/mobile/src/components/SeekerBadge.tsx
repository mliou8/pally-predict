import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, radius } from './ui/theme'

export const SeekerBadge = () => {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>⚡ Seeker</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
})
