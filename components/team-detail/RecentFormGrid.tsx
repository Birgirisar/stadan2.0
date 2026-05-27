/**
 * FotMob-style 5-cell recent form grid.
 *
 * Layout (newest → oldest, left → right):
 *   ┌──────────────────────────────────────────────────────────┐
 *   │  [score pill]  [score pill]  [score pill]  …             │
 *   │  [opp crest ]  [opp crest ]  [opp crest ]  …             │
 *   └──────────────────────────────────────────────────────────┘
 *
 * The leftmost cell (most recent) has a 2px colored underline.
 * Score pill: actual home/away score (not "this team first").
 * Pill color: W=green, D=grey, L=red from THIS team's perspective.
 * Tap → navigate to that match.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme/useTheme';
import { TeamBadge } from '../fixtures/TeamBadge';
import type { FormEntry } from '../../lib/utils/form';
import type { Fixture } from '../../lib/api/types';

interface Props {
  form: FormEntry[];
  fixtures: Fixture[];
  teamId: number;
}

const CELL_COUNT = 5;

export function RecentFormGrid({ form, fixtures, teamId }: Props) {
  const { colors } = useTheme();
  const router = useRouter();

  if (!form.length) return null;

  return (
    <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.textSecondary }]}>
        Form · Síðustu 5
      </Text>

      <View style={styles.grid}>
        {Array.from({ length: CELL_COUNT }, (_, i) => {
          const entry = form[i] ?? null;
          const fixture = fixtures[i] ?? null;

          if (!entry) {
            return (
              <View key={i} style={styles.cell}>
                <View style={[styles.pillEmpty, { backgroundColor: colors.surfaceSunken }]} />
                <View style={[styles.crestEmpty, { backgroundColor: colors.surfaceSunken }]} />
              </View>
            );
          }

          const pillColor =
            entry.result === 'W' ? colors.win
            : entry.result === 'L' ? colors.loss
            : colors.draw;

          // Score is always home – away (not this-team-first)
          const scoreLabel = `${entry.homeGoals} – ${entry.awayGoals}`;

          // Opponent = the other team from this team's perspective
          const opponent = entry.isTargetHome ? entry.awayTeam : entry.homeTeam;

          return (
            <Pressable
              key={i}
              style={({ pressed }) => [styles.cell, pressed && { opacity: 0.65 }]}
              onPress={() => fixture && router.push(`/match/${fixture.id}` as any)}
            >
              {/* Score pill */}
              <View style={[styles.pill, { backgroundColor: pillColor }]}>
                <Text style={styles.pillText}>{scoreLabel}</Text>
              </View>

              {/* Opponent crest */}
              <TeamBadge
                imageUrl={opponent?.image_path ?? ''}
                shortCode={opponent?.short_code ?? opponent?.name?.slice(0, 3) ?? '?'}
                size={28}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 14,
    marginTop: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    paddingBottom: 18,
    gap: 14,
  },
  title: {
    fontFamily: 'BricolageGrotesque_700Bold',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  grid: {
    flexDirection: 'row',
    gap: 8,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  pill: {
    width: '100%',
    paddingVertical: 5,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontFamily: 'BricolageGrotesque_800ExtraBold',
    fontSize: 11.5,
    color: '#fff',
    letterSpacing: -0.2,
  },
  pillEmpty: {
    width: '100%',
    height: 26,
    borderRadius: 8,
  },
  crestEmpty: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
});
