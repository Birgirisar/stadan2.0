import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../lib/theme/useTheme';

interface Props {
  imageUrl: string;
  shortCode: string;
  size?: number;
}

export function TeamBadge({ imageUrl, shortCode, size = 22 }: Props) {
  const [hasError, setHasError] = useState(false);
  const { colors } = useTheme();

  const radius = size / 2;

  if (hasError || !imageUrl) {
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
          style={[
            styles.fallbackText,
            { color: colors.textMuted, fontSize: size * 0.38 },
          ]}
          numberOfLines={1}
        >
          {(shortCode ?? '?').slice(0, 3)}
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageUrl }}
      style={{ width: size, height: size, borderRadius: radius }}
      onError={() => setHasError(true)}
    />
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
