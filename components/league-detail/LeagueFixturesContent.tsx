import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../lib/theme/useTheme';
import { MatchRow } from '../fixtures/MatchRow';
import type { Fixture, RoundFull } from '../../lib/api/types';
import { formatRoundDateRange } from '../../lib/utils/rounds';

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  fixtures: Fixture[];
  /** Full round object for the selected round — used for the date-range header. */
  selectedRound: RoundFull | undefined;
  /** True while fetching rounds metadata (shows skeleton chips in the header). */
  roundsLoading: boolean;
  /** True while fetching fixtures for the current round. */
  fixturesLoading: boolean;
  /** Error from the rounds fetch. Full-tab retry. */
  roundsError: Error | null;
  /** Error from the fixtures fetch. Inline retry; round selector stays visible. */
  fixturesError: Error | null;
  onRetryRounds: () => void;
  onRetryFixtures: () => void;
  /** Aggregate scoreline per fixture id, for two-legged play-off ties. See LeagueDetailScreen. */
  aggregateByFixtureId?: Map<number, string>;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const SKELETON_ROWS = 4;

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow({ isLast, borderColor, bgColor }: { isLast: boolean; borderColor: string; bgColor: string }) {
  return (
    <View
      style={[
        styles.skeletonRow,
        { borderBottomColor: borderColor },
        isLast && styles.lastSkeletonRow,
      ]}
    >
      <View style={[styles.skeletonPill, { backgroundColor: bgColor, width: 32 }]} />
      <View style={[styles.skeletonPill, { backgroundColor: bgColor, flex: 1 }]} />
      <View style={[styles.skeletonPill, { backgroundColor: bgColor, width: 44 }]} />
      <View style={[styles.skeletonPill, { backgroundColor: bgColor, flex: 1 }]} />
      <View style={[styles.skeletonPill, { backgroundColor: bgColor, width: 32 }]} />
    </View>
  );
}

// ─── Date-range label above the card ─────────────────────────────────────────
function DateLabel({ text, color }: { text: string; color: string }) {
  if (!text) return null;
  return <Text style={[styles.dateLabel, { color }]}>{text}</Text>;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function LeagueFixturesContent({
  fixtures,
  selectedRound,
  roundsLoading,
  fixturesLoading,
  roundsError,
  fixturesError,
  onRetryRounds,
  onRetryFixtures,
  aggregateByFixtureId,
}: Props) {
  const { colors } = useTheme();

  const dateLabel = selectedRound ? formatRoundDateRange(selectedRound) : '';

  // ── Full-tab round error ───────────────────────────────────────────────────
  if (roundsError && !roundsLoading) {
    return (
      <View style={styles.container}>
        <View
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={styles.errorInner}>
            <Text style={[styles.errorText, { color: colors.textMuted }]}>
              Villa við að sækja umferðir
            </Text>
            <TouchableOpacity
              onPress={onRetryRounds}
              activeOpacity={0.7}
              style={[styles.retryBtn, { backgroundColor: colors.text }]}
            >
              <Text style={[styles.retryBtnText, { color: colors.bg }]}>Reyna aftur</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ── Fixtures skeleton (round selected, fetching) ──────────────────────────
  if (fixturesLoading) {
    return (
      <View style={styles.container}>
        <DateLabel text={dateLabel} color={colors.textMuted} />
        <View
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
            <SkeletonRow
              key={i}
              isLast={i === SKELETON_ROWS - 1}
              borderColor={colors.border}
              bgColor={colors.surfaceSunken}
            />
          ))}
        </View>
      </View>
    );
  }

  // ── Fixtures error (round selector stays visible above) ───────────────────
  if (fixturesError) {
    return (
      <View style={styles.container}>
        <DateLabel text={dateLabel} color={colors.textMuted} />
        <View
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={styles.errorInner}>
            <Text style={[styles.errorText, { color: colors.textMuted }]}>
              Villa við að sækja leiki
            </Text>
            <TouchableOpacity
              onPress={onRetryFixtures}
              activeOpacity={0.7}
              style={[styles.retryBtn, { backgroundColor: colors.text }]}
            >
              <Text style={[styles.retryBtnText, { color: colors.bg }]}>Reyna aftur</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ── Empty round ────────────────────────────────────────────────────────────
  if (fixtures.length === 0 && selectedRound) {
    return (
      <View style={styles.container}>
        <DateLabel text={dateLabel} color={colors.textMuted} />
        <View
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={styles.emptyInner}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Engir leikir í þessari umferð
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // ── Fixture list ───────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <DateLabel text={dateLabel} color={colors.textMuted} />
      <View
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        {fixtures.map((fixture, i) => (
          <MatchRow
            key={fixture.id}
            fixture={fixture}
            isLast={i === fixtures.length - 1}
            aggregateLabel={aggregateByFixtureId?.get(fixture.id)}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 16,
  },
  dateLabel: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
    letterSpacing: 0.3,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },

  // ── Skeleton ──────────────────────────────────────────────────────────────
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  lastSkeletonRow: {
    borderBottomWidth: 0,
  },
  skeletonPill: {
    height: 14,
    borderRadius: 7,
  },

  // ── Error / empty ─────────────────────────────────────────────────────────
  errorInner: {
    padding: 28,
    alignItems: 'center',
    gap: 14,
  },
  errorText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryBtnText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
  },
  emptyInner: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
  },
});
