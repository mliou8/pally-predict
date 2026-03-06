import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import Colors from '../constants/colors';

interface WagerSliderProps {
  value: number;
  onChange: (value: number) => void;
  maxValue: number;
  minValue?: number;
}

const PRESET_PERCENTAGES = [25, 50, 75, 100];

export default function WagerSlider({
  value,
  onChange,
  maxValue,
  minValue = 10,
}: WagerSliderProps) {
  const sliderWidth = useSharedValue(0);
  const thumbX = useSharedValue(0);

  const updateValue = (percentage: number) => {
    const newValue = Math.round(minValue + (maxValue - minValue) * (percentage / 100));
    onChange(Math.min(Math.max(newValue, minValue), maxValue));
  };

  const handlePreset = (percentage: number) => {
    const newValue = Math.round(maxValue * (percentage / 100));
    onChange(Math.min(Math.max(newValue, minValue), maxValue));
  };

  const percentage = maxValue > minValue
    ? ((value - minValue) / (maxValue - minValue)) * 100
    : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Wager Amount</Text>
        <View style={styles.valueContainer}>
          <Text style={styles.value}>{value.toLocaleString()}</Text>
          <Text style={styles.unit}>WP</Text>
        </View>
      </View>

      {/* Slider Track */}
      <View style={styles.sliderContainer}>
        <View style={styles.track}>
          <View
            style={[styles.fill, { width: `${percentage}%` }]}
          />
          <View
            style={[styles.thumb, { left: `${percentage}%` }]}
          />
        </View>
      </View>

      {/* Preset Buttons */}
      <View style={styles.presets}>
        {PRESET_PERCENTAGES.map((pct) => (
          <TouchableOpacity
            key={pct}
            style={[
              styles.presetButton,
              Math.abs(percentage - pct) < 5 && styles.presetButtonActive,
            ]}
            onPress={() => handlePreset(pct)}
          >
            <Text
              style={[
                styles.presetText,
                Math.abs(percentage - pct) < 5 && styles.presetTextActive,
              ]}
            >
              {pct}%
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Manual Input Row */}
      <View style={styles.inputRow}>
        <TouchableOpacity
          style={styles.adjustButton}
          onPress={() => onChange(Math.max(minValue, value - 10))}
        >
          <Text style={styles.adjustText}>-10</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.adjustButton}
          onPress={() => onChange(Math.max(minValue, value - 100))}
        >
          <Text style={styles.adjustText}>-100</Text>
        </TouchableOpacity>
        <View style={styles.spacer} />
        <TouchableOpacity
          style={styles.adjustButton}
          onPress={() => onChange(Math.min(maxValue, value + 100))}
        >
          <Text style={styles.adjustText}>+100</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.adjustButton}
          onPress={() => onChange(Math.min(maxValue, value + 10))}
        >
          <Text style={styles.adjustText}>+10</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.balanceText}>
        Balance: {maxValue.toLocaleString()} WP
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.dark.accent,
  },
  unit: {
    fontSize: 14,
    color: Colors.dark.textMuted,
  },
  sliderContainer: {
    marginBottom: 16,
  },
  track: {
    height: 8,
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: 4,
    position: 'relative',
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.dark.accent,
    borderRadius: 4,
  },
  thumb: {
    position: 'absolute',
    top: -6,
    marginLeft: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.dark.accent,
    borderWidth: 3,
    borderColor: Colors.dark.background,
  },
  presets: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  presetButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.dark.surfaceLight,
    alignItems: 'center',
  },
  presetButtonActive: {
    backgroundColor: Colors.dark.accentDim,
  },
  presetText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
  },
  presetTextActive: {
    color: Colors.dark.accent,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  adjustButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: Colors.dark.surfaceLight,
  },
  adjustText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
  },
  spacer: {
    flex: 1,
  },
  balanceText: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    textAlign: 'center',
  },
});
