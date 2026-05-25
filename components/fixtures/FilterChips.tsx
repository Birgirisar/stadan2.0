import React, { useEffect, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../lib/theme/useTheme';

export type FilterType = 'all' | 'live' | 'favorites' | 'male' | 'female';

interface Props {
  active: FilterType;
  onSelect: (f: FilterType) => void;
  hasLive: boolean;
  isToday: boolean;
}

function LiveDot({ color }: { color: string }) {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.3, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 750, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);
  return (
    <Animated.View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color, opacity }} />
  );
}

const CHIPS: Array<{ id: FilterType; label: string }> = [
  { id: 'all', label: 'Allir leikir' },
  { id: 'live', label: 'Í beinni' },
  { id: 'favorites', label: 'Uppáhald' },
  { id: 'male', label: 'Karla' },
  { id: 'female', label: 'Kvenna' },
];

export function FilterChips({ active, onSelect, hasLive, isToday }: Props) {
  const { colors } = useTheme();

  const visibleChips = isToday ? CHIPS : CHIPS.filter((c) => c.id !== 'live');

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {visibleChips.map((chip) => {
        const isActive = active === chip.id;
        return (
          <TouchableOpacity
            key={chip.id}
            onPress={() => onSelect(chip.id)}
            style={[
              styles.chip,
              {
                backgroundColor: isActive ? colors.text : colors.surface,
                borderColor: isActive ? colors.text : colors.border,
              },
            ]}
            activeOpacity={0.7}
          >
            {chip.id === 'live' && hasLive && (
              <View style={{ marginRight: 4 }}>
                <LiveDot color={isActive ? colors.bg : colors.live} />
              </View>
            )}
            <Text
              style={[
                styles.chipLabel,
                { color: isActive ? colors.bg : colors.textSecondary },
              ]}
            >
              {chip.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 8,
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipLabel: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12.5,
    letterSpacing: 0.1,
  },
});
