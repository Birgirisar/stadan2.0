import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../lib/theme/useTheme';

interface Props {
  showPromotion: boolean;
  showRelegation: boolean;
}

export function ZoneLegend({ showPromotion, showRelegation }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {showPromotion && (
        <View style={styles.row}>
          <View style={[styles.stripe, { backgroundColor: colors.promotion }]} />
          <Text style={[styles.label, { color: colors.textMuted }]}>Evrópukeppni</Text>
        </View>
      )}
      {showRelegation && (
        <View style={styles.row}>
          <View style={[styles.stripe, { backgroundColor: colors.relegation }]} />
          <Text style={[styles.label, { color: colors.textMuted }]}>Fall í Lengjudeild</Text>
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
