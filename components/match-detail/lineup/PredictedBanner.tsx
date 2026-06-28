import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../lib/theme/useTheme';

export function PredictedBanner() {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: colors.goldSoft,
          borderColor: colors.gold + '40',
        },
      ]}
    >
      <Ionicons name="time-outline" size={14} color={colors.gold} />
      <Text style={[styles.text, { color: colors.textSecondary }]}>
        <Text style={{ color: colors.gold, fontFamily: 'Manrope_800ExtraBold' }}>Spáð lið · </Text>
        Byggt á síðustu leikjum. Byrjunarlið birtast um klukkutíma fyrir leik.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 14,
    marginTop: 14,
    marginBottom: 0,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  text: {
    flex: 1,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11.5,
    lineHeight: 16,
  },
});
