import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../lib/theme/useTheme';

export function EmptyState() {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.borderStrong }]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.surfaceSunken }]}>
        <Ionicons name="people-outline" size={22} color={colors.textMuted} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>Byrjunarlið ekki tiltæk</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 14,
    marginTop: 24,
    padding: 28,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'BricolageGrotesque_800ExtraBold',
    fontSize: 15,
    letterSpacing: -0.1,
    textAlign: 'center',
  },
});
