import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../lib/theme/useTheme';

// League IDs where promotion means moving up a division (not European competition)
const PROMOTION_UP_LEAGUES = new Set([348, 1711, 351]);

// Promotion label per league (overrides the default)
const PROMOTION_LABELS: Record<number, string> = {
  345: 'Umspil um Íslandsmeistaratitil og Evrópusæti',
  1710: 'Umspil um Íslandsmeistaratitil og Evrópusæti',
  351: 'Beint upp í Lengjudeild',
};

// Playoff label per league
const PLAYOFF_LABELS: Record<number, string> = {
  345: 'Umspil um að halda sér í Bestu deild (síðustu tvö sætin falla niður í Lengjudeild)',
  348: 'Umspil (1 lið fer upp í Bestu deild)',
  1710: 'Umspil um að halda sér í Bestu deild (síðustu tvö sætin falla niður í Lengjudeild)',
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
}

export function ZoneLegend({ showPromotion, showPlayoff, showRelegation, leagueId }: Props) {
  const { colors } = useTheme();

  const promotionLabel = (leagueId && PROMOTION_LABELS[leagueId])
    ?? (leagueId && PROMOTION_UP_LEAGUES.has(leagueId) ? 'Beint upp í Bestu deild' : 'Evrópukeppni');

  return (
    <View style={styles.container}>
      {showPromotion && (
        <View style={styles.row}>
          <View style={[styles.stripe, { backgroundColor: colors.promotion }]} />
          <Text style={[styles.label, { color: colors.textMuted }]}>{promotionLabel}</Text>
        </View>
      )}
      {showPlayoff && (
        <View style={styles.row}>
          <View style={[styles.stripe, { backgroundColor: colors.playoff }]} />
          <Text style={[styles.label, { color: colors.textMuted }]}>
            {(leagueId && PLAYOFF_LABELS[leagueId]) ?? 'Umspil'}
          </Text>
        </View>
      )}
      {showRelegation && (
        <View style={styles.row}>
          <View style={[styles.stripe, { backgroundColor: colors.relegation }]} />
          <Text style={[styles.label, { color: colors.textMuted }]}>
            {(leagueId && RELEGATION_LABELS[leagueId]) ?? 'Fall í Lengjudeild'}
          </Text>
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
