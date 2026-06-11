import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { StandingRow } from '../../lib/api/types';
import { useTheme } from '../../lib/theme/useTheme';
import { ZONE_RULES, type ZoneLabels } from '../../constants/leagues';
import { StandingsRow } from './StandingsRow';
import { ZoneLegend } from './ZoneLegend';

interface Props {
  rows: StandingRow[];
  mode: 'tafla' | 'form';
  leagueId: number;
  liveTeamIds: Set<number>;
  /** Team IDs to highlight with accent-soft background (0–2 values; match detail use) */
  highlightTeamIds?: number[];
  /**
   * Explicit position→zone map. When provided, overrides the ZONE_RULES lookup.
   * Pass an empty object {} to suppress all zone colours (e.g. groups with no rules).
   */
  zoneRules?: Record<number, 'promotion' | 'playoff' | 'relegation'>;
  /** Custom legend labels that override the default league-based strings. */
  zoneLabels?: ZoneLabels;
}

function resolveZoneColor(
  leagueId: number,
  row: StandingRow,
  zoneRules: Record<number, 'promotion' | 'playoff' | 'relegation'> | undefined
): 'promotion' | 'playoff' | 'relegation' | null {
  if (zoneRules !== undefined) {
    return zoneRules[row.position] ?? null;
  }
  if (ZONE_RULES[leagueId]) {
    return ZONE_RULES[leagueId][row.position] ?? null;
  }
  if (row.rule?.name) {
    const n = row.rule.name.toLowerCase();
    if (n.includes('promotion') || n.includes('champions') || n.includes('europa') || n.includes('conference') || n.includes('evrópukeppni')) return 'promotion';
    if (n.includes('relegation') || n.includes('fall')) return 'relegation';
  }
  return null;
}

function getTeamId(row: StandingRow): number {
  return row.participant_id ?? row.team_id ?? row.participant?.id ?? 0;
}

export function StandingsTable({ rows, mode, leagueId, liveTeamIds, highlightTeamIds, zoneRules, zoneLabels }: Props) {
  const highlightSet = highlightTeamIds ? new Set(highlightTeamIds) : null;
  const { colors } = useTheme();

  const hasPromotionZone = rows.some((r) => resolveZoneColor(leagueId, r, zoneRules) === 'promotion');
  const hasPlayoffZone   = rows.some((r) => resolveZoneColor(leagueId, r, zoneRules) === 'playoff');
  const hasRelegationZone = rows.some((r) => resolveZoneColor(leagueId, r, zoneRules) === 'relegation');

  return (
    <>
      {/* Column headers */}
      <View
        style={[
          styles.tableCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={[styles.head, { backgroundColor: colors.surfaceSunken, borderBottomColor: colors.border }]}>
          {mode === 'tafla' ? (
            <>
              <Text style={[styles.th, styles.thPos, { color: colors.textMuted }]}>#</Text>
              <View style={styles.thCrest} />
              <Text style={[styles.th, styles.thTeam, { color: colors.textMuted }]}>Lið</Text>
              <Text style={[styles.th, styles.thNum, { color: colors.textMuted }]}>L</Text>
              <Text style={[styles.th, styles.thNum, { color: colors.textMuted }]}>U</Text>
              <Text style={[styles.th, styles.thNum, { color: colors.textMuted }]}>J</Text>
              <Text style={[styles.th, styles.thNum, { color: colors.textMuted }]}>T</Text>
              <Text style={[styles.th, styles.thGD, { color: colors.textMuted }]}>+/-</Text>
              <Text style={[styles.th, styles.thPts, { color: colors.textMuted }]}>Stig</Text>
            </>
          ) : (
            <>
              <Text style={[styles.th, styles.thPos, { color: colors.textMuted }]}>#</Text>
              <View style={styles.thCrest} />
              <Text style={[styles.th, styles.thTeam, { color: colors.textMuted }]}>Lið</Text>
              <Text style={[styles.th, styles.thForm, { color: colors.textMuted }]}>Form (5)</Text>
            </>
          )}
        </View>

        {rows.map((row, idx) => {
          const zoneColor = resolveZoneColor(leagueId, row, zoneRules);
          const teamId = getTeamId(row);
          return (
            <StandingsRow
              key={row.participant_id ?? row.team_id ?? idx}
              row={row}
              mode={mode}
              zoneColor={zoneColor}
              isLive={liveTeamIds.has(teamId)}
              isLast={idx === rows.length - 1}
              isHighlighted={highlightSet?.has(teamId) ?? false}
            />
          );
        })}
      </View>

      {(hasPromotionZone || hasPlayoffZone || hasRelegationZone) && (
        <ZoneLegend
          showPromotion={hasPromotionZone}
          showPlayoff={hasPlayoffZone}
          showRelegation={hasRelegationZone}
          leagueId={leagueId}
          promotionLabel={zoneLabels?.promotion}
          playoffLabel={zoneLabels?.playoff}
          relegationLabel={zoneLabels?.relegation}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  tableCard: {
    marginHorizontal: 14,
    marginTop: 8,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingLeft: 6,
    paddingVertical: 10,
    gap: 5,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  th: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 9.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  thPos: { width: 22 },
  thCrest: { width: 22 },
  thTeam: { flex: 1, textAlign: 'left', paddingLeft: 2 },
  thNum: { width: 22 },
  thGD: { width: 22 },
  thPts: { width: 30 },
  thForm: { flex: 0, textAlign: 'right' },
});
