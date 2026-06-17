import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../lib/theme/useTheme';
import { FixturesList } from './FixturesList';
import type { Fixture } from '../../../lib/api/types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  seasonId: number | null;
  fixtures: Fixture[];
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  scrollViewRef?: React.RefObject<any>;
  heroFull: number;
  compactH: number;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SKELETON_COUNT = 5;

function SkeletonRow({ isLast, borderColor, bgColor }: { isLast: boolean; borderColor: string; bgColor: string }) {
  return (
    <View
      style={[styles.skeletonRow, { borderBottomColor: borderColor }, isLast && styles.skeletonLast]}
    >
      <View style={[styles.skeletonPill, { backgroundColor: bgColor, width: 32 }]} />
      <View style={[styles.skeletonPill, { backgroundColor: bgColor, flex: 1 }]} />
      <View style={[styles.skeletonPill, { backgroundColor: bgColor, width: 44 }]} />
      <View style={[styles.skeletonPill, { backgroundColor: bgColor, flex: 1 }]} />
      <View style={[styles.skeletonPill, { backgroundColor: bgColor, width: 32 }]} />
    </View>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TeamLeikirTab({
  seasonId,
  fixtures,
  isLoading,
  error,
  onRetry,
  scrollViewRef,
  heroFull,
  compactH,
}: Props) {
  const { colors } = useTheme();

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.outer}>
        <View style={styles.skeletonSpacer} />
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <SkeletonRow
              key={i}
              isLast={i === SKELETON_COUNT - 1}
              borderColor={colors.border}
              bgColor={colors.surfaceSunken}
            />
          ))}
        </View>
      </View>
    );
  }

  // ── Network error ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={[styles.emptyTitle, { color: colors.textMuted }]}>
          Villa við að sækja leiki
        </Text>
        <TouchableOpacity
          onPress={onRetry}
          activeOpacity={0.7}
          style={[styles.retryBtn, { backgroundColor: colors.text }]}
        >
          <Text style={[styles.retryText, { color: colors.bg }]}>Reyna aftur</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── No season ID (team with no known season) ───────────────────────────────
  if (!seasonId) {
    return (
      <View style={styles.centered}>
        <Text style={[styles.emptyTitle, { color: colors.textMuted }]}>
          Engir leikir tiltækir fyrir þetta lið
        </Text>
      </View>
    );
  }

  // ── Season exists but no fixtures yet ─────────────────────────────────────
  if (fixtures.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Tímabilið er ekki hafið</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
          Leikir birtast þegar þeir hafa verið skipulagðir.
        </Text>
      </View>
    );
  }

  // ── Fixture list ───────────────────────────────────────────────────────────
  return (
    <FixturesList
      fixtures={fixtures}
      scrollViewRef={scrollViewRef}
      heroFull={heroFull}
      compactH={compactH}
    />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  outer: {
    paddingHorizontal: 14,
    paddingTop: 20,
  },
  skeletonSpacer: {
    height: 28,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },

  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  skeletonLast: {
    borderBottomWidth: 0,
  },
  skeletonPill: {
    height: 14,
    borderRadius: 7,
  },

  centered: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 28,
    gap: 10,
  },
  emptyTitle: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 15,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 4,
  },
  retryText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
  },
});
