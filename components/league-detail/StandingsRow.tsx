import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { StandingRow } from '../../lib/api/types';
import { TeamBadge } from '../fixtures/TeamBadge';
import { useTheme } from '../../lib/theme/useTheme';
import { extractStat, parseForm } from '../../lib/api/leagues';

interface Props {
  row: StandingRow;
  mode: 'tafla' | 'form';
  zoneColor?: 'promotion' | 'relegation' | null;
  isLive?: boolean;
  isLast?: boolean;
}

// Try a direct numeric field on the raw row object before falling back to details[]
function getStatRaw(row: StandingRow, fieldName: string, keys: string[]): number {
  const raw = (row as unknown as Record<string, unknown>)[fieldName];
  if (typeof raw === 'number') return raw;
  return extractStat(row, keys);
}

function gdStr(n: number): string {
  if (n > 0) return `+${n}`;
  return `${n}`;
}

export function StandingsRow({ row, mode, zoneColor, isLive, isLast }: Props) {
  const { colors } = useTheme();
  const team = row.participant;

  const played = getStatRaw(row, 'overall_matches_played', ['overall_matches_played', 'OVERALL_MATCHES_PLAYED', 'overall-matches-played']);
  const won = getStatRaw(row, 'overall_won', ['overall_won', 'OVERALL_WON', 'overall-won']);
  const drawn = getStatRaw(row, 'overall_draw', ['overall_draw', 'OVERALL_DRAW', 'overall-draw']);
  const lost = getStatRaw(row, 'overall_lost', ['overall_lost', 'OVERALL_LOST', 'overall-lost']);
  const gd = getStatRaw(row, 'overall_goal_difference', ['overall_goal_difference', 'OVERALL_GOAL_DIFFERENCE', 'overall-goal-difference']);
  const pts = getStatRaw(row, 'overall_points', ['overall_points', 'OVERALL_POINTS', 'overall-points']);

  const formLetters = parseForm(row.form);

  return (
    <View
      style={[
        styles.row,
        {
          borderBottomColor: colors.border,
          borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
        },
      ]}
    >
      {/* Zone stripe */}
      {zoneColor && (
        <View
          style={[
            styles.zoneStripe,
            { backgroundColor: colors[zoneColor] },
          ]}
        />
      )}

      {/* Position */}
      <Text style={[styles.pos, { color: colors.textSecondary }]}>{row.position}</Text>

      {/* Crest */}
      <TeamBadge
        imageUrl={team?.image_path ?? ''}
        shortCode={team?.short_code ?? team?.name?.slice(0, 3) ?? '?'}
        size={22}
      />

      {/* Team name + live dot */}
      <View style={styles.teamCell}>
        <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={1}>
          {team?.name ?? '—'}
        </Text>
        {isLive && (
          <View style={[styles.liveDot, { backgroundColor: colors.live }]} />
        )}
      </View>

      {mode === 'tafla' ? (
        <>
          <Text style={[styles.num, { color: colors.textSecondary }]}>{played}</Text>
          <Text style={[styles.num, styles.win, { color: colors.win }]}>{won}</Text>
          <Text style={[styles.num, { color: colors.textSecondary }]}>{drawn}</Text>
          <Text style={[styles.num, styles.loss, { color: colors.loss }]}>{lost}</Text>
          <Text style={[styles.num, { color: colors.textSecondary }]}>{gdStr(gd)}</Text>
          <Text style={[styles.pts, { color: colors.text }]}>{pts}</Text>
        </>
      ) : (
        <View style={styles.formRow}>
          {formLetters.map((r, i) => (
            <View
              key={i}
              style={[
                styles.formPill,
                { backgroundColor: r === 'W' ? colors.win : r === 'D' ? colors.draw : colors.loss },
              ]}
            >
              <Text style={styles.formLetter}>{r}</Text>
            </View>
          ))}
          {/* Pad empty pills if fewer than 5 results */}
          {Array.from({ length: Math.max(0, 5 - formLetters.length) }).map((_, i) => (
            <View
              key={`empty-${i}`}
              style={[styles.formPill, { backgroundColor: colors.surfaceSunken }]}
            >
              <Text style={[styles.formLetter, { color: colors.textMuted }]}>·</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingLeft: 6,
    paddingVertical: 10,
    gap: 5,
    position: 'relative',
  },
  zoneStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  pos: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 12.5,
    width: 22,
    textAlign: 'center',
  },
  teamCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
    paddingLeft: 2,
  },
  teamName: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12.5,
    flexShrink: 1,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    flexShrink: 0,
  },
  num: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 11.5,
    width: 22,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  win: {},
  loss: {},
  pts: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 13,
    width: 30,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  formRow: {
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'flex-end',
  },
  formPill: {
    width: 20,
    height: 20,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formLetter: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 10,
    color: '#fff',
  },
});
