import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../lib/theme/useTheme';

export function LeaguePlaceholderTab() {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color: colors.textMuted }]}>Kemur fljótlega</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 64,
    alignItems: 'center',
  },
  text: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 15,
  },
});
