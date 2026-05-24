import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../lib/theme/useTheme';

export function CommentaryEmpty() {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <Ionicons name="chatbubble-ellipses-outline" size={36} color={colors.textMuted} />
      <Text style={[styles.title, { color: colors.textMuted }]}>
        Engin lýsing tiltæk
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
    gap: 10,
  },
  title: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 15,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
});
