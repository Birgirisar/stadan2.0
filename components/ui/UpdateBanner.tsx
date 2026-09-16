import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/theme/useTheme';

interface Props {
  visible: boolean;
  onPress: () => void;
}

export function UpdateBanner({ visible, onPress }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: visible ? 1 : 0,
      useNativeDriver: true,
      tension: 140,
      friction: 12,
    }).start();
  }, [visible, progress]);

  return (
    <Animated.View
      pointerEvents={visible ? 'box-none' : 'none'}
      style={[
        styles.wrap,
        {
          bottom: insets.bottom + 90,
          opacity: progress,
          transform: [
            { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
          ],
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.btn,
          { backgroundColor: colors.text },
          pressed && { opacity: 0.85 },
        ]}
      >
        <Ionicons name="sparkles" size={14} color={colors.bg} />
        <Text style={[styles.text, { color: colors.bg }]}>Ný útgáfa til — Endurræsa</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 14,
    right: 14,
    alignItems: 'center',
    zIndex: 30,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  text: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
  },
});
