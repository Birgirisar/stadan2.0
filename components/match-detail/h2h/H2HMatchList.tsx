import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../lib/theme/useTheme';
import { H2HMatchRow } from './H2HMatchRow';
import type { Fixture } from '../../../lib/api/types';

interface Props {
  meetings: Fixture[];
}

export function H2HMatchList({ meetings }: Props) {
  const { colors } = useTheme();

  // Group by year (newest first — meetings are already sorted newest first)
  const grouped = meetings.reduce<{ year: number; fixtures: Fixture[] }[]>((acc, fixture) => {
    const year = new Date(fixture.starting_at).getFullYear();
    const existing = acc.find((g) => g.year === year);
    if (existing) {
      existing.fixtures.push(fixture);
    } else {
      acc.push({ year, fixtures: [fixture] });
    }
    return acc;
  }, []);

  return (
    <View style={styles.container}>
      {grouped.map(({ year, fixtures }) => (
        <View key={year}>
          <Text style={[styles.yearHeading, { color: colors.textSecondary }]}>
            {year}
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {fixtures.map((fixture, index) => (
              <H2HMatchRow
                key={fixture.id}
                fixture={fixture}
                isLast={index === fixtures.length - 1}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 14,
    gap: 0,
  },
  yearHeading: {
    fontFamily: 'BricolageGrotesque_700Bold',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingTop: 18,
    paddingBottom: 8,
    paddingHorizontal: 8,
  },
  card: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
});
