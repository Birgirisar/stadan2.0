import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../lib/theme/useTheme';

interface Props {
  type: 'next' | 'live';
}

export function NextMatchLabel({ type }: Props) {
  const { colors } = useTheme();
  const isLive = type === 'live';
  return (
    <View style={[styles.container, { backgroundColor: isLive ? colors.liveSoft : colors.accentSoft }]}>
      <Text style={[styles.text, { color: isLive ? colors.live : colors.accent }]}>
        {isLive ? 'Í gangi núna' : 'Næsti leikur'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    marginLeft: 22,
    marginTop: 6,
    marginBottom: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
  },
  text: {
    fontFamily: 'BricolageGrotesque_700Bold',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
