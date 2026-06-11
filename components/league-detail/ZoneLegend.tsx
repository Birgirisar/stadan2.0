import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../lib/theme/useTheme';

// League IDs where promotion means moving up a division (not European competition)
const PROMOTION_UP_LEAGUES = new Set([348, 1711, 351]);

// Promotion label per league (overrides the default)
const PROMOTION_LABELS: Record<number, string> = {
  // Split-phase leagues: the "promotion" zone in the regular season table means going to Efri hluti
  345: 'Efri hluti',
  1710: 'Efri hluti',
  351: 'Beint upp í Lengjudeild',
};

// Playoff label per league
const PLAYOFF_LABELS: Record<number, string> = {
  // Split-phase leagues: the "playoff" zone in the regular season table means going to Neðri hluti
  345: 'Neðri hluti',
  348: 'Umspil (1 lið fer upp í Bestu deild)',
  1710: 'Neðri hluti',
};

// Relegation label per league
const RELEGATION_LABELS: Record<number, string> = {
  345: 'Fall í Lengjudeild',
  348: 'Fall í 2. deild',
  1710: 'Fall í Lengjudeild',
  1711: 'Fall í 2. deild',
  351: 'Fall í 3. deild',
};

interface Props {
  showPromotion: boolean;
  showPlayoff?: boolean;
  showRelegation: boolean;
  leagueId?: number;
  /** Override the default league-based promotion label */
  promotionLabel?: string;
  /** Override the default league-based playoff label */
  playoffLabel?: string;
  /** Override the default league-based relegation label */
  relegationLabel?: string;
}

export function ZoneLegend({
  showPromotion,
  showPlayoff,
  showRelegation,
  leagueId,
  promotionLabel,
  playoffLabel,
  relegationLabel,
}: Props) {
  const { colors } = useTheme();

  const resolvedPromotion =
    promotionLabel ??
    (leagueId && PROMOTION_LABELS[leagueId]) ??
    (leagueId && PROMOTION_UP_LEAGUES.has(leagueId) ? 'Beint upp í Bestu deild' : 'Evrópukeppni');

  const resolvedPlayoff =
    playoffLabel ??
    (leagueId && PLAYOFF_LABELS[leagueId]) ??
    'Umspil';

  const resolvedRelegation =
    relegationLabel ??
    (leagueId && RELEGATION_LABELS[leagueId]) ??
    'Fall í Lengjudeild';

  return (
    <View style={styles.container}>
      {showPromotion && (
        <View style={styles.row}>
          <View style={[styles.stripe, { backgroundColor: colors.promotion }]} />
          <Text style={[styles.label, { color: colors.textMuted }]}>{resolvedPromotion}</Text>
        </View>
      )}
      {showPlayoff && (
        <View style={styles.row}>
          <View style={[styles.stripe, { backgroundColor: colors.playoff }]} />
          <Text style={[styles.label, { color: colors.textMuted }]}>{resolvedPlayoff}</Text>
        </View>
      )}
      {showRelegation && (
        <View style={styles.row}>
          <View style={[styles.stripe, { backgroundColor: colors.relegation }]} />
          <Text style={[styles.label, { color: colors.textMuted }]}>{resolvedRelegation}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 14,
    marginTop: 14,
    gap: 6,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stripe: {
    width: 3,
    height: 14,
    borderRadius: 2,
  },
  label: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
  },
});
