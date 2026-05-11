import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/theme/useTheme';

export default function FrettirScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top + 20 }]}>
      <Text style={[styles.title, { color: colors.text }]}>Fréttir</Text>
      <Text style={[styles.sub, { color: colors.textMuted }]}>kemur fljótlega</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'BricolageGrotesque_800ExtraBold',
    fontSize: 32,
    letterSpacing: -0.8,
  },
  sub: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 15,
    marginTop: 8,
  },
});
