import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../lib/theme/useTheme';
import { getTeamPrimaryColor } from '../../../lib/constants/teamColors';
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
  const total = homeWins + draws + awayWins;

  const homeRatio = total > 0 ? homeWins / total : 0;
  const drawRatio = total > 0 ? draws / total : 0;
  const awayRatio = total > 0 ? awayWins / total : 0;

  const homeBadgeColor = getTeamPrimaryColor(homeTeam.id) ?? colors.accent;
  const awayBadgeColor = getTeamPrimaryColor(awayTeam.id) ?? colors.loss;

  // Shorten name to first word if it's long so the label fits in one line
  const homeLabel = `${firstWord(homeTeam.name)} sigur`;
  const awayLabel = `${firstWord(awayTeam.name)} sigur`;

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
        {`Innbyrðis · ${totalMatches} leikir`}
      </Text>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {/* Three-badge tally */}
        <View style={styles.badgesRow}>
          <TallyBadge
            count={homeWins}
            label={homeLabel}
            badgeColor={homeBadgeColor}
            labelColor={colors.textMuted}
          />
          <TallyBadge
            count={draws}
            label="Jafntefli"
            badgeColor={colors.draw}
            labelColor={colors.textMuted}
          />
          <TallyBadge
            count={awayWins}
            label={awayLabel}
            badgeColor={awayBadgeColor}
            labelColor={colors.textMuted}
          />
        </View>

        {/* Proportional bar */}
        {total > 0 && (
          <View style={styles.bar}>
            {homeWins > 0 && (
              <View
                style={[
                  styles.barSegment,
                  styles.barLeft,
                  draws === 0 && awayWins === 0 && styles.barRight,
                  { flex: homeRatio, backgroundColor: homeBadgeColor },
                ]}
              />
            )}
            {draws > 0 && (
              <View
                style={[
                  styles.barSegment,
                  homeWins === 0 && styles.barLeft,
                  awayWins === 0 && styles.barRight,
                  { flex: drawRatio, backgroundColor: colors.draw },
                ]}
              />
            )}
            {awayWins > 0 && (
              <View
                style={[
                  styles.barSegment,
                  styles.barRight,
                  draws === 0 && homeWins === 0 && styles.barLeft,
                  { flex: awayRatio, backgroundColor: awayBadgeColor },
                ]}
              />
            )}
          </View>
        )}
      </View>
    </View>
  );
}

function firstWord(name: string): string {
  return name.split(' ')[0];
}

function TallyBadge({
  count,
  label,
  badgeColor,
  labelColor,
}: {
  count: number;
  label: string;
  badgeColor: string;
  labelColor: string;
}) {
  return (
    <View style={styles.badgeCol}>
      <View style={[styles.badge, { backgroundColor: badgeColor }]}>
        <Text style={styles.badgeNumber}>{count}</Text>
      </View>
      <Text style={[styles.badgeLabel, { color: labelColor }]} numberOfLines={1}>
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
    gap: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badgeCol: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeNumber: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 26,
    letterSpacing: -0.5,
    color: '#ffffff',
  },
  badgeLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  bar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    gap: 1,
  },
  barSegment: {
    height: '100%',
  },
  barLeft: {
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  barRight: {
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
});
