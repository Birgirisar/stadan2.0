import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { getLocalTeamBadge } from '../../constants/teamBadges';
import { useTheme } from '../../lib/theme/useTheme';

interface Props {
  imageUrl: string;
  shortCode: string;
  size?: number;
  teamId?: number;
}

export function TeamBadge({ imageUrl, shortCode, size = 22, teamId }: Props) {
  const [hasError, setHasError] = useState(false);
  const { colors } = useTheme();

  const radius = size / 2;
  const localSource = getLocalTeamBadge(teamId);

  // Local images take priority — the API often returns a placeholder URL for
  // teams without photos, so we can't rely on onError to trigger the fallback.
  if (localSource) {
    return (
      <Image
        source={localSource}
        style={{ width: size, height: size, borderRadius: radius }}
      />
    );
  }

  if (!hasError && imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={{ width: size, height: size, borderRadius: radius }}
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: colors.surfaceElev,
          borderColor: colors.border,
        },
      ]}
    >
      <Text
        style={[styles.fallbackText, { color: colors.textMuted, fontSize: size * 0.38 }]}
        numberOfLines={1}
      >
        {(shortCode ?? '?').slice(0, 3)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    fontFamily: 'BricolageGrotesque_800ExtraBold',
    letterSpacing: -0.5,
  },
});
