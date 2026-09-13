import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/theme/useTheme';
import type { RoundFull } from '../../lib/api/types';

// ─── Chip geometry (matches DaySelector proportions) ─────────────────────────
const CHIP_MIN_W = 52;
const CHIP_GAP = 8;
const CHIP_STEP = CHIP_MIN_W + CHIP_GAP;
const SKELETON_COUNT = 6;
const PAD_H = 14;

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
        <Text style={[styles.label, { color: colors.textMuted }]}>Umferðir</Text>
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
          // Synthetic rounds (e.g. a promotion play-off with no native Round
          // objects — see fetchRoundsForSeason) always carry embedded fixtures;
          // real rounds never do. Reuse that as the "extra round" marker so
          // these chips read visibly differently from the regular-season ones.
          const isExtra = !!round.fixtures;

          return (
            <TouchableOpacity
              key={round.id}
              onPress={() => onSelect(round.id)}
              activeOpacity={0.7}
              style={[
                styles.chip,
                isActive
                  ? { backgroundColor: isExtra ? colors.playoff : colors.text }
                  : isExtra
                  ? { backgroundColor: colors.playoff + '1f', borderWidth: 1, borderColor: colors.playoff + '66' }
                  : { backgroundColor: 'transparent' },
              ]}
            >
              {/* Trophy glyph — marks extra (play-off) rounds */}
              {isExtra && (
                <Ionicons
                  name="trophy"
                  size={9}
                  color={isActive ? colors.bg : colors.playoff}
                  style={styles.extraIcon}
                />
              )}

              <Text
                style={[
                  styles.chipNum,
                  { color: isActive ? colors.bg : isExtra ? colors.playoff : colors.textMuted },
                  isActive && styles.chipNumActive,
                ]}
              >
                {round.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <Text style={[styles.label, { color: colors.textMuted }]}>Umferðir</Text>
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
  extraIcon: {
    position: 'absolute',
    top: 6,
    left: 7,
  },
  label: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 10.5,
    letterSpacing: 0.3,
    textAlign: 'center',
    paddingHorizontal: PAD_H,
    paddingBottom: 8,
  },
});
