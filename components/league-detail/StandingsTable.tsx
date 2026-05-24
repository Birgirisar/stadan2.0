import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { StandingRow } from '../../lib/api/types';
import { useTheme } from '../../lib/theme/useTheme';
import { ZONE_RULES } from '../../constants/leagues';
import { StandingsRow } from './StandingsRow';
import { ZoneLegend } from './ZoneLegend';

interface Props {
  rows: StandingRow[];
  mode: 'tafla' | 'form';
  leagueId: number;
  liveTeamIds: Set<number>;
  /** Team IDs to highlight with accent-soft background (0–2 values; match detail use) */
  highlightTeamIds?: number[];
}

function getZoneColor(
  leagueId: number,
  row: StandingRow
): 'promotion' | 'relegation' | null {
  // Try API rule first
  if (row.rule?.name) {
    const ruleName = row.rule.name.toLowerCase();
    if (
      ruleName.includes('promotion') ||
      ruleName.includes('champions') ||
      ruleName.includes('europa') ||
      ruleName.includes('conference') ||
      ruleName.includes('evrópukeppni')
    ) {
      return 'promotion';
    }
    if (ruleName.includes('relegation') || ruleName.includes('fall')) {
      return 'relegation';
    }
  }
  // Fall back to hardcoded rules
  return ZONE_RULES[leagueId]?.[row.position] ?? null;
}

function getTeamId(row: StandingRow): number {
  return row.participant_id ?? row.team_id ?? row.participant?.id ?? 0;
}

export function StandingsTable({ rows, mode, leagueId, liveTeamIds, highlightTeamIds }: Props) {
  const highlightSet = highlightTeamIds ? new Set(highlightTeamIds) : null;
  const { colors } = useTheme();

  const hasPromotionZone = rows.some((r) => getZoneColor(leagueId, r) === 'promotion');
  const hasRelegationZone = rows.some((r) => getZoneColor(leagueId, r) === 'relegation');

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
          const zoneColor = getZoneColor(leagueId, row);
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

      {(hasPromotionZone || hasRelegationZone) && (
        <ZoneLegend
          showPromotion={hasPromotionZone}
          showRelegation={hasRelegationZone}
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
