import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Colors, { OPTION_COLORS } from '../constants/colors';

interface AnswerCardProps {
  text: string;
  optionId: string;
  index: number;
  isSelected: boolean;
  isLocked: boolean;
  onPress: () => void;
  imageUrl?: string | null;
}

export default function AnswerCard({
  text,
  optionId,
  index,
  isSelected,
  isLocked,
  onPress,
  imageUrl,
}: AnswerCardProps) {
  // Use the actual option ID (A, B, C, D) for colors, not the visual position
  const optionIndex = optionId.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
  const colors = OPTION_COLORS[optionIndex % OPTION_COLORS.length];

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(index * 60 + 100, withTiming(1, { duration: 300 }));
    translateY.value = withDelay(index * 60 + 100, withTiming(0, { duration: 300 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: isSelected ? colors.bg : Colors.dark.surface },
          isLocked && !isSelected && styles.buttonLocked,
        ]}
        onPress={onPress}
        disabled={isLocked}
        activeOpacity={0.8}
      >
        {/* Watermark letter */}
        <Text
          style={[
            styles.watermark,
            { color: isSelected ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.03)' },
          ]}
        >
          {optionId}
        </Text>

        <View style={styles.content}>
          {/* Option image thumbnail */}
          {imageUrl && (
            <Image source={{ uri: imageUrl }} style={styles.thumbnail} />
          )}

          {/* Selection indicator */}
          {isSelected && !imageUrl && (
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={14} color="#000" />
            </View>
          )}

          {/* Check overlay on image when selected */}
          {isSelected && imageUrl && (
            <View style={[styles.imageCheckCircle, { backgroundColor: colors.bg }]}>
              <Ionicons name="checkmark" size={14} color={colors.text} />
            </View>
          )}

          {/* Answer text */}
          <View style={[styles.textContainer, !isSelected && !imageUrl && styles.textPadded]}>
            <Text
              style={[
                styles.text,
                { color: isSelected ? colors.text : Colors.dark.text },
              ]}
            >
              {text}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  button: {
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 72,
    position: 'relative',
  },
  buttonLocked: {
    opacity: 0.25,
  },
  watermark: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -24 }],
    fontSize: 48,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  content: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageCheckCircle: {
    position: 'absolute',
    left: 16,
    top: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    paddingRight: 64,
  },
  textPadded: {
    paddingLeft: 36,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
});
