import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../lib/theme/useTheme';
import type { H2HSummary } from '../../../lib/utils/h2h';
import type { Participant } from '../../../lib/api/types';


interface Props {
  summary: H2HSummary;
  homeTeam: Participant;
  awayTeam: Participant;
}

export function H2HSummaryCard({ summary, homeTeam, awayTeam }: Props) {
  const { colors } = useTheme();
  const { homeWins, awayWins, draws, totalMatches } = summary;

  const homeLabel = `${firstWord(homeTeam.name)} sigur`;
  const awayLabel = `${firstWord(awayTeam.name)} sigur`;

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
        {`Innbyrðis · ${totalMatches} leikir`}
      </Text>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {/* Three-column tally */}
        <View style={styles.tallyRow}>
          <TallyCol count={homeWins} label={homeLabel} textColor={colors.text} labelColor={colors.textMuted} />
          <TallyCol count={draws} label="Jafntefli" textColor={colors.text} labelColor={colors.textMuted} />
          <TallyCol count={awayWins} label={awayLabel} textColor={colors.text} labelColor={colors.textMuted} />
        </View>

      </View>
    </View>
  );
}

function firstWord(name: string): string {
  return name.split(' ')[0];
}

function TallyCol({
  count,
  label,
  textColor,
  labelColor,
}: {
  count: number;
  label: string;
  textColor: string;
  labelColor: string;
}) {
  return (
    <View style={styles.tallyCol}>
      <Text style={[styles.tallyNumber, { color: textColor }]}>{count}</Text>
      <Text style={[styles.tallyLabel, { color: labelColor }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 16,
    marginHorizontal: 14,
  },
  sectionHeading: {
    fontFamily: 'BricolageGrotesque_700Bold',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  card: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  tallyRow: {
    flexDirection: 'row',
  },
  tallyCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  tallyNumber: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 34,
    letterSpacing: -1,
    lineHeight: 38,
  },
  tallyLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
