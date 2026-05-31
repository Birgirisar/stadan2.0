import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../lib/theme/useTheme';

interface Props {
  label: string;
}

export function MonthSectionHeader({ label }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 18,
    paddingBottom: 8,
    paddingHorizontal: 22,
  },
  label: {
    fontFamily: 'BricolageGrotesque_700Bold',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.78,
  },
});
