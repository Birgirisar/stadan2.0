import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Fixture } from '../../lib/api/types';
import { computeForm, type FormEntry } from '../../lib/utils/form';
import { useTheme } from '../../lib/theme/useTheme';
import { TeamBadge } from '../fixtures/TeamBadge';

interface Props {
  homeTeamId: number;
  awayTeamId: number;
  homeFixtures: Fixture[] | undefined;
  awayFixtures: Fixture[] | undefined;
  homeLoading: boolean;
  awayLoading: boolean;
  leagueName?: string;
}

export function RecentForm({
  homeTeamId,
  awayTeamId,
  homeFixtures,
  awayFixtures,
  homeLoading,
  awayLoading,
  leagueName,
}: Props) {
  const { colors } = useTheme();

  const homeForm = homeFixtures ? computeForm(homeFixtures, homeTeamId) : null;
  const awayForm = awayFixtures ? computeForm(awayFixtures, awayTeamId) : null;

  const maxRows = Math.max(homeForm?.length ?? 0, awayForm?.length ?? 0, 1);

  return (
    <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {leagueName ? `Síðustu 5 · ${leagueName}` : 'Form · Síðustu 5'}
        </Text>
      </View>
      <View style={styles.grid}>
        {Array.from({ length: maxRows }, (_, i) => (
          <View key={i} style={styles.rowPair}>
            <FormRowCell
              entry={homeForm?.[i] ?? null}
              loading={homeLoading}
              colors={colors}
            />
            <FormRowCell
              entry={awayForm?.[i] ?? null}
              loading={awayLoading}
              colors={colors}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

interface CellProps {
  entry: FormEntry | null;
  loading: boolean;
  colors: ReturnType<typeof import('../../lib/theme/useTheme').useTheme>['colors'];
}

function FormRowCell({ entry, loading, colors }: CellProps) {
  if (loading || !entry) {
    return (
      <View style={[styles.cellSkeleton, { backgroundColor: colors.surfaceSunken }]} />
    );
  }

  const pillColor =
    entry.result === 'W' ? colors.win : entry.result === 'L' ? colors.loss : colors.draw;

  return (
    <View style={styles.cell}>
      <TeamBadge
        imageUrl={entry.homeTeam.image_path}
        shortCode={entry.homeTeam.short_code}
        size={24}
      />
      <View style={[styles.scorePill, { backgroundColor: pillColor }]}>
        <Text style={styles.scoreText}>
          {entry.homeGoals} - {entry.awayGoals}
        </Text>
      </View>
      <TeamBadge
        imageUrl={entry.awayTeam.image_path}
        shortCode={entry.awayTeam.short_code}
        size={24}
      />
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
  header: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  sectionTitle: {
    fontFamily: 'BricolageGrotesque_700Bold',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  grid: { paddingHorizontal: 12, paddingBottom: 16, gap: 10 },
  rowPair: { flexDirection: 'row', gap: 24 },
  cell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cellSkeleton: {
    flex: 1,
    height: 28,
    borderRadius: 8,
  },
  scorePill: {
    flex: 1,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontFamily: 'BricolageGrotesque_800ExtraBold',
    fontSize: 13,
    color: '#fff',
    letterSpacing: 0.1,
  },
});
