import React from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Standing } from '../../lib/api/types';
import { useTheme } from '../../lib/theme/useTheme';
import { TeamBadge } from '../fixtures/TeamBadge';

interface Props {
  standings: Standing[];
  homeTeamId: number;
  awayTeamId: number;
  onSeeTable?: () => void;
}

function getTeamId(s: Standing): number {
  return s.team_id ?? s.participant_id ?? 0;
}

function getStat(s: Standing, typeId: number): number {
  if (s.details) {
    return s.details.find((d) => d.type_id === typeId)?.value ?? 0;
  }
  return 0;
}

export function MiniLeagueTable({ standings, homeTeamId, awayTeamId, onSeeTable }: Props) {
  const { colors } = useTheme();
  const router = useRouter();

  const homeRow = standings.find((s) => getTeamId(s) === homeTeamId);
  const awayRow = standings.find((s) => getTeamId(s) === awayTeamId);

  if (!homeRow && !awayRow) return null;

  const rows: Array<Standing | 'divider'> = [];

  const aPos = homeRow?.position ?? 999;
  const bPos = awayRow?.position ?? 999;
  const [first, second] = aPos <= bPos ? [homeRow, awayRow] : [awayRow, homeRow];

  if (first) rows.push(first);
  rows.push('divider');
  if (second) rows.push(second);

  return (
    <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Staða í deildinni
        </Text>
        {onSeeTable && (
          <TouchableOpacity onPress={onSeeTable} activeOpacity={0.7} style={styles.linkRow}>
            <Text style={[styles.linkText, { color: colors.textMuted }]}>Sjá töflu</Text>
            <Text style={[styles.linkChev, { color: colors.textMuted }]}>›</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Table header */}
      <View style={[styles.tableHeader, { borderColor: colors.border }]}>
        <Text style={[styles.colNum, styles.colHeader, { color: colors.textMuted }]}>#</Text>
        <Text style={[styles.colTeam, styles.colHeader, { color: colors.textMuted }]}>Lið</Text>
        <Text style={[styles.colStat, styles.colHeader, { color: colors.textMuted }]}>L</Text>
        <Text style={[styles.colStat, styles.colHeader, { color: colors.textMuted }]}>+/-</Text>
        <Text style={[styles.colPts, styles.colHeader, { color: colors.textMuted }]}>Stig</Text>
      </View>

      {rows.map((row, idx) => {
        if (row === 'divider') {
          return (
            <View
              key="div"
              style={[styles.dividerRow, { borderColor: colors.border, backgroundColor: colors.surface }]}
            >
              <Text style={[styles.dividerText, { color: colors.textMuted }]}>· · ·</Text>
            </View>
          );
        }

        const teamId = getTeamId(row);
        const isHighlight = teamId === homeTeamId || teamId === awayTeamId;
        const team = row.participant;

        // Try to get stats from direct fields first, then details fallback
        const played = row.played ?? getStat(row, 1);
        const gd = row.goal_difference ?? (row.goals_scored ?? 0) - (row.goals_against ?? 0);
        const pts = row.points ?? getStat(row, 186);
        const gdStr = gd > 0 ? `+${gd}` : `${gd}`;

        return (
          <Pressable
            key={`row-${idx}`}
            onPress={() => router.push(`/team/${teamId}` as any)}
            style={({ pressed }) => [
              styles.tableRow,
              { borderColor: colors.border },
              isHighlight && { backgroundColor: colors.accentSoft },
              pressed && { opacity: 0.65 },
            ]}
          >
            <Text style={[styles.colNum, styles.posText, { color: colors.textSecondary }]}>
              {row.position}
            </Text>
            <View style={styles.colTeam}>
              <TeamBadge
                imageUrl={team?.image_path ?? ''}
                shortCode={team?.short_code ?? team?.name?.slice(0, 3) ?? '?'}
                size={18}
              />
              <Text
                style={[
                  styles.teamName,
                  { color: colors.text },
                  isHighlight && styles.teamNameHighlight,
                ]}
                numberOfLines={1}
              >
                {team?.name ?? '—'}
              </Text>
            </View>
            <Text style={[styles.colStat, styles.statText, { color: colors.textSecondary }]}>
              {played}
            </Text>
            <Text style={[styles.colStat, styles.statText, { color: colors.textSecondary }]}>
              {gdStr}
            </Text>
            <Text style={[styles.colPts, styles.ptsText, { color: colors.text }]}>{pts}</Text>
          </Pressable>
        );
      })}
    </View>
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
  },
  sectionTitle: {
    fontFamily: 'BricolageGrotesque_700Bold',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  linkText: { fontFamily: 'Manrope_600SemiBold', fontSize: 12 },
  linkChev: { fontFamily: 'Manrope_600SemiBold', fontSize: 14 },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    gap: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  dividerRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 6,
    alignItems: 'center',
  },
  dividerText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 10.5,
    letterSpacing: 0.4,
  },
  colNum: { width: 28, textAlign: 'center' },
  colTeam: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 },
  colStat: { width: 28, textAlign: 'center' },
  colPts: { width: 36, textAlign: 'center' },
  colHeader: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  posText: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 13,
  },
  teamName: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    flexShrink: 1,
  },
  teamNameHighlight: { fontFamily: 'Manrope_700Bold' },
  statText: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 12,
  },
  ptsText: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 13,
  },
});
