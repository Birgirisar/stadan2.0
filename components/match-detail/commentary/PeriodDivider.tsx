import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../lib/theme/useTheme';

interface Props {
  label: string;
}

export function PeriodDivider({ label }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View
        style={[
          styles.pill,
          { backgroundColor: colors.surfaceSunken, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  pill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  label: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 10.5,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
