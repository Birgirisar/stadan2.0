import React, { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLeagueStandings } from '../../lib/hooks/useLeagueDetail';
import { StandingsTable } from '../league-detail/StandingsTable';
import { ViewToggle, type ViewMode } from '../league-detail/ViewToggle';
import { useTheme } from '../../lib/theme/useTheme';

// ── Layout constants matching StandingsTable / ViewToggle StyleSheets ──────────
// Used to estimate the scroll offset for the auto-scroll feature.
// ViewToggle: marginTop(14) + height(~40) + marginBottom(8)
const TOGGLE_AREA_H = 62;
// StandingsTable card: marginTop(8) + header row(~42)
const TABLE_PREAMBLE_H = 50;
// Each StandingsRow: paddingVertical(10+10) + badge(22) ≈ 42
const ROW_H = 42;

function estimatedRowOffset(idx: number): number {
  return TOGGLE_AREA_H + TABLE_PREAMBLE_H + idx * ROW_H;
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface Props {
  seasonId: number | undefined;
  leagueId: number;
  homeTeamId: number | undefined;
  awayTeamId: number | undefined;
  liveTeamIds?: Set<number>;
  /**
   * Ref to the parent ScrollView — used for the auto-scroll that centres
   * both highlighted teams in the viewport on first load.
   * Pass the ref from the Animated.ScrollView in the match-detail screen;
   * Animated.ScrollView proxies scrollTo to the underlying ScrollView node.
   */
  scrollRef?: React.RefObject<ScrollView | null>;
  /** Full hero height at scroll=0 (used to compute absolute scroll target). */
  heroFull: number;
  /** Collapsed hero height (sticky bar + sub-tabs + top inset). */
  heroCollapsedH: number;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TaflaTab({
  seasonId,
  leagueId,
  homeTeamId,
  awayTeamId,
  liveTeamIds = new Set(),
  scrollRef,
  heroFull,
  heroCollapsedH,
}: Props) {
  const { colors } = useTheme();
  const [mode, setMode] = useState<ViewMode>('tafla');
  // useLeagueStandings uses fetchStandingsFull which includes form/details/rule
  // and correctly handles the flat-array response format our leagues return.
  const { data: rows, isLoading, error, refetch } = useLeagueStandings(seasonId ?? null);

  // Guard so we only auto-scroll on the very first render that has data.
  const hasScrolled = useRef(false);

  useEffect(() => {
    if (!rows?.length || hasScrolled.current || !scrollRef?.current) return;
    if (homeTeamId == null || awayTeamId == null) return;

    const idx0 = rows.findIndex(
      (r) => (r.participant_id ?? r.team_id) === homeTeamId,
    );
    const idx1 = rows.findIndex(
      (r) => (r.participant_id ?? r.team_id) === awayTeamId,
    );

    if (idx0 < 0 || idx1 < 0) return;

    // Use the lower (later-in-list) index so the higher team is above it and
    // therefore also visible.
    const lowerIdx = Math.max(idx0, idx1);

    // Both teams in the top 4 — already visible at scroll=0, skip.
    if (lowerIdx < 4) return;

    hasScrolled.current = true;

    const rowOffset = estimatedRowOffset(lowerIdx);
    // Absolute content-space Y of the target row, adjusted so it lands just
    // below the collapsed hero with a small breathing gap.
    const targetY = Math.max(0, heroFull + rowOffset - heroCollapsedH - 24);

    setTimeout(() => {
      // Animated.ScrollView exposes scrollTo via the underlying node.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (scrollRef.current as any)?.scrollTo({ y: targetY, animated: true });
    }, 120);
  }, [rows]); // intentionally omit stable refs/numbers from deps

  // ── No season — cup tie that somehow has the Tafla tab ──────────────────────
  if (seasonId == null) {
    return (
      <View style={styles.centred}>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          Tafla ekki tiltæk fyrir þennan leik
        </Text>
      </View>
    );
  }

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <>
        <ViewToggle mode={mode} onChange={setMode} />
        <View
          style={[
            styles.skeletonCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.skeletonRow,
                {
                  borderBottomColor: colors.border,
                  borderBottomWidth: i === 4 ? 0 : StyleSheet.hairlineWidth,
                },
              ]}
            >
              <View
                style={[
                  styles.skeletonPill,
                  { width: 22, backgroundColor: colors.surfaceSunken },
                ]}
              />
              <View
                style={[
                  styles.skeletonPill,
                  { width: 22, backgroundColor: colors.surfaceSunken },
                ]}
              />
              <View
                style={[
                  styles.skeletonPill,
                  { flex: 1, backgroundColor: colors.surfaceSunken },
                ]}
              />
              <View
                style={[
                  styles.skeletonPill,
                  { width: 80, backgroundColor: colors.surfaceSunken },
                ]}
              />
            </View>
          ))}
        </View>
      </>
    );
  }

  // ── Network error ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <View style={styles.centred}>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          Ekki tókst að sækja töfluna
        </Text>
        <Pressable
          onPress={() => refetch()}
          style={[styles.retryBtn, { borderColor: colors.border }]}
        >
          <Text style={[styles.retryText, { color: colors.text }]}>
            Reyna aftur
          </Text>
        </Pressable>
      </View>
    );
  }

  // ── Empty standings ──────────────────────────────────────────────────────────
  if (!rows?.length) {
    return (
      <View style={styles.centred}>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          Engar stöðutölur tiltækar
        </Text>
      </View>
    );
  }

  // ── Full standings ───────────────────────────────────────────────────────────
  const highlightIds = [homeTeamId, awayTeamId].filter(
    (x): x is number => x != null,
  );

  return (
    <>
      <ViewToggle mode={mode} onChange={setMode} />
      <StandingsTable
        rows={rows}
        mode={mode}
        leagueId={leagueId}
        liveTeamIds={liveTeamIds}
        highlightTeamIds={highlightIds.length > 0 ? highlightIds : undefined}
      />
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  centred: {
    paddingTop: 60,
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  retryText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
  },
  skeletonCard: {
    marginHorizontal: 14,
    marginTop: 8,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingLeft: 6,
    paddingVertical: 11,
    gap: 8,
  },
  skeletonPill: {
    height: 14,
    borderRadius: 7,
    opacity: 0.45,
  },
});
