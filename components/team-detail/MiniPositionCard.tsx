import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/theme/useTheme';
import { TeamBadge } from '../fixtures/TeamBadge';
import type { StandingRow } from '../../lib/api/types';
import { extractStat } from '../../lib/api/leagues';

interface Props {
  standings: StandingRow[];
  teamId: number;
  leagueName: string | null;
  leagueId: number | null;
}

function getTeamId(r: StandingRow): number {
  return r.participant_id ?? r.team_id ?? r.participant?.id ?? 0;
}

function getStat(row: StandingRow, keys: string[]): number {
  // Try direct field first
  for (const key of keys) {
    const v = (row as any)[key];
    if (typeof v === 'number') return v;
  }
  return extractStat(row, keys);
}

function gdStr(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

export function MiniPositionCard({ standings, teamId, leagueName, leagueId }: Props) {
  const { colors } = useTheme();
  const router = useRouter();

  if (!standings.length) return null;

  const teamIdx = standings.findIndex((r) => getTeamId(r) === teamId);
  if (teamIdx === -1) return null;

  // Show 2 above + team + 2 below, clamped to array bounds
  const start = Math.max(0, teamIdx - 2);
  const end = Math.min(standings.length, teamIdx + 3);
  const slice = standings.slice(start, end);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.section,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && { opacity: 0.7 },
      ]}
      onPress={() => leagueId && router.push(`/league/${leagueId}` as any)}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textSecondary }]}>Staða í deild</Text>
        <View style={styles.headerRight}>
          {leagueName && (
            <Text style={[styles.leagueLabel, { color: colors.textMuted }]} numberOfLines={1}>
              {leagueName}
            </Text>
          )}
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
        </View>
      </View>

      {/* Table header */}
      <View style={[styles.thead, { borderColor: colors.border }]}>
        <Text style={[styles.th, styles.colPos, { color: colors.textMuted }]}>#</Text>
        <Text style={[styles.th, styles.colTeam, { color: colors.textMuted }]}>Lið</Text>
        <Text style={[styles.th, styles.colNum, { color: colors.textMuted }]}>L</Text>
        <Text style={[styles.th, styles.colNum, { color: colors.textMuted }]}>+/-</Text>
        <Text style={[styles.th, styles.colPts, { color: colors.textMuted }]}>Stig</Text>
      </View>

      {slice.map((row, idx) => {
        const tid = getTeamId(row);
        const isHighlight = tid === teamId;
        const team = row.participant;

        const played = getStat(row, ['overall_matches_played', 'played']);
        const gd = getStat(row, ['overall_goal_difference', 'goal_difference']) ||
          ((getStat(row, ['goals_scored', 'overall_goals_scored']) || 0) -
           (getStat(row, ['goals_against', 'overall_goals_against']) || 0));
        const pts = getStat(row, ['overall_points', 'points']);

        return (
          <View
            key={`row-${idx}`}
            style={[
              styles.row,
              { borderColor: colors.border },
              idx === 0 && { borderTopWidth: 0 },
              isHighlight && { backgroundColor: colors.accentSoft },
            ]}
          >
            <Text style={[styles.pos, { color: colors.textSecondary }]}>{row.position}</Text>
            <View style={styles.colTeam}>
              <TeamBadge
                imageUrl={team?.image_path ?? ''}
                shortCode={team?.short_code ?? team?.name?.slice(0, 3) ?? '?'}
                size={18}
                teamId={tid}
              />
              <Text
                style={[
                  styles.teamName,
                  { color: isHighlight ? colors.text : colors.textSecondary },
                  isHighlight && styles.teamNameBold,
                ]}
                numberOfLines={1}
              >
                {team?.name ?? '—'}
              </Text>
            </View>
            <Text style={[styles.stat, styles.colNum, { color: colors.textSecondary }]}>{played}</Text>
            <Text style={[styles.stat, styles.colNum, { color: colors.textSecondary }]}>{gdStr(gd)}</Text>
            <Text style={[styles.pts, styles.colPts, { color: isHighlight ? colors.text : colors.textSecondary }]}>{pts}</Text>
          </View>
        );
      })}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 14,
    marginTop: 16,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    fontFamily: 'BricolageGrotesque_700Bold',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  leagueLabel: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11.5,
    flexShrink: 1,
  },
  thead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 5,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  th: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 9.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 5,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  pos: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 12.5,
    width: 22,
    textAlign: 'center',
  },
  colPos: { width: 22, textAlign: 'center' },
  colTeam: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7, minWidth: 0 },
  colNum: { width: 26, textAlign: 'center' },
  colPts: { width: 32, textAlign: 'center' },
  teamName: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12.5,
    flexShrink: 1,
  },
  teamNameBold: { fontFamily: 'Manrope_700Bold' },
  stat: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 11.5,
    textAlign: 'center',
  },
  pts: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 13,
    textAlign: 'center',
  },
});
