import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../lib/theme/useTheme';

export function PlaceholderTab() {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color: colors.textMuted }]}>Kemur fljótlega</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  text: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 15,
    letterSpacing: 0.1,
  },
});
