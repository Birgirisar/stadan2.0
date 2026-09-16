import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OFF_SEASON } from '../constants/offSeason';
import { useTheme } from '../lib/theme/useTheme';

// Standalone screen mounted instead of the whole tab stack — nothing here
// fetches from the Sportmonks API. See constants/offSeason.ts.
export function OffSeasonScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <Text style={[styles.brand, { color: colors.text }]}>
        Staðan<Text style={{ color: colors.accent }}>.</Text>
      </Text>

      <View style={styles.center}>
        <View style={[styles.iconWrap, { backgroundColor: colors.surfaceSunken, borderColor: colors.border }]}>
          <Ionicons name="moon-outline" size={30} color={colors.textMuted} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Hlé á tímabilinu</Text>
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {OFF_SEASON.resumeMessage}
        </Text>
      </View>

      <View style={{ height: 1 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    fontFamily: 'BricolageGrotesque_800ExtraBold',
    fontSize: 22,
    letterSpacing: -0.5,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontFamily: 'BricolageGrotesque_800ExtraBold',
    fontSize: 22,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  message: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 14.5,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 280,
  },
});
