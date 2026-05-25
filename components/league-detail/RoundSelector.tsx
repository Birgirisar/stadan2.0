import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../lib/theme/useTheme';
import type { RoundFull } from '../../lib/api/types';
import { isRoundLive } from '../../lib/utils/rounds';

// ─── Chip geometry (matches DaySelector proportions) ─────────────────────────
const CHIP_MIN_W = 52;
const CHIP_GAP = 8;
const CHIP_STEP = CHIP_MIN_W + CHIP_GAP;
const SKELETON_COUNT = 6;
const PAD_H = 14;

// ─── Pulsing live dot ─────────────────────────────────────────────────────────
function PulseDot({ color }: { color: string }) {
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
    <Animated.View
      style={[styles.pulseDot, { backgroundColor: color, opacity }]}
    />
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  rounds: RoundFull[];
  selectedRoundId: number | undefined;
  onSelect: (id: number) => void;
  isLoading: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function RoundSelector({ rounds, selectedRoundId, onSelect, isLoading }: Props) {
  const { colors } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const [viewWidth, setViewWidth] = useState(Dimensions.get('window').width);

  // Scroll the selected chip into view, centered
  useEffect(() => {
    if (!selectedRoundId || !rounds.length) return;
    const idx = rounds.findIndex((r) => r.id === selectedRoundId);
    if (idx < 0) return;
    // Center the chip: chipCenter – half viewport
    const chipCenter = PAD_H + idx * CHIP_STEP + CHIP_MIN_W / 2;
    const x = Math.max(0, chipCenter - viewWidth / 2);
    scrollRef.current?.scrollTo({ x, animated: true });
  }, [selectedRoundId, viewWidth, rounds]);

  // ── Skeleton state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={[styles.wrap, { borderBottomColor: colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.content}
          scrollEnabled={false}
        >
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <View
              key={i}
              style={[styles.chipSkeleton, { backgroundColor: colors.surfaceSunken }]}
            />
          ))}
        </ScrollView>
      </View>
    );
  }

  // ── Chips ──────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.wrap, { borderBottomColor: colors.border }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
        onLayout={(e) => setViewWidth(e.nativeEvent.layout.width)}
      >
        {rounds.map((round) => {
          const isActive = round.id === selectedRoundId;
          const live = isRoundLive(round);

          return (
            <TouchableOpacity
              key={round.id}
              onPress={() => onSelect(round.id)}
              activeOpacity={0.7}
              style={[
                styles.chip,
                isActive
                  ? { backgroundColor: colors.text }
                  : { backgroundColor: 'transparent' },
              ]}
            >
              {/* Live pulse dot — only shown for unselected live rounds */}
              {live && !isActive && <PulseDot color={colors.live} />}

              <Text
                style={[
                  styles.chipNum,
                  { color: isActive ? colors.bg : colors.textMuted },
                  isActive && styles.chipNumActive,
                ]}
              >
                {round.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  content: {
    paddingHorizontal: PAD_H,
    paddingVertical: 8,
    gap: CHIP_GAP,
    flexDirection: 'row',
  },
  chip: {
    minWidth: CHIP_MIN_W,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  chipSkeleton: {
    width: CHIP_MIN_W,
    height: 38,
    borderRadius: 14,
  },
  chipNum: {
    fontFamily: 'BricolageGrotesque_700Bold',
    fontSize: 19,
    lineHeight: 23,
  },
  chipNumActive: {
    fontFamily: 'BricolageGrotesque_800ExtraBold',
  },
  pulseDot: {
    position: 'absolute',
    top: 5,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
