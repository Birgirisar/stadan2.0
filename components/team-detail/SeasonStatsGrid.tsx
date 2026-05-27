import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../lib/theme/useTheme';
import type { SeasonStats } from '../../lib/hooks/useTeamDetail';

interface Props {
  stats: SeasonStats;
}

interface StatCell {
  label: string;
  value: string | number;
  accent?: boolean;
}

export function SeasonStatsGrid({ stats }: Props) {
  const { colors } = useTheme();

  const cells: StatCell[] = [
    { label: 'Leikir', value: stats.played },
    { label: 'Sigrar', value: stats.won, accent: true },
    { label: 'Jafntefli', value: stats.draw },
    { label: 'Töp', value: stats.lost },
    { label: 'Mörk', value: stats.goalsFor, accent: true },
    { label: 'Á sig', value: stats.goalsAgainst },
  ];

  return (
    <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.textSecondary }]}>
        Tölfræði tímabils
      </Text>
      <View style={styles.grid}>
        {cells.map((cell, idx) => (
          <View
            key={idx}
            style={[
              styles.cell,
              { borderColor: colors.border },
              // Right border on cols 0, 1, 3, 4 (2×3 grid with no border after col 2 and 5)
              (idx % 3 !== 2) && styles.cellRightBorder,
              idx < 3 && styles.cellBottomBorder,
            ]}
          >
            <Text
              style={[
                styles.value,
                { color: cell.accent ? colors.accent : colors.text },
              ]}
            >
              {cell.value}
            </Text>
            <Text style={[styles.label, { color: colors.textMuted }]}>{cell.label}</Text>
          </View>
        ))}
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
    overflow: 'hidden',
    paddingTop: 14,
    paddingBottom: 4,
  },
  title: {
    fontFamily: 'BricolageGrotesque_700Bold',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '33.33%',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 4,
  },
  cellRightBorder: {
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  cellBottomBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  value: {
    fontFamily: 'BricolageGrotesque_800ExtraBold',
    fontSize: 28,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  label: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
