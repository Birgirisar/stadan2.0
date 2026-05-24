import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../lib/theme/useTheme';

interface Props {
  teamName: string;
  imageUrl: string;
  formation: string;
}

export const TeamFormationLine = React.memo(function TeamFormationLine({
  teamName,
  imageUrl,
  formation,
}: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      {!!imageUrl && (
        <Image source={{ uri: imageUrl }} style={styles.crest} resizeMode="contain" />
      )}
      <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
        {teamName}
      </Text>
      {!!formation && (
        <View style={[styles.tag, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.tagText, { color: colors.textSecondary }]}>{formation}</Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    marginHorizontal: 14,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  crest: {
    width: 22,
    height: 22,
    flexShrink: 0,
  },
  name: {
    fontFamily: 'BricolageGrotesque_800ExtraBold',
    fontSize: 15,
    letterSpacing: -0.2,
  },
  tag: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  tagText: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 11.5,
    letterSpacing: 0.2,
  },
});
