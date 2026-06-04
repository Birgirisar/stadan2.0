import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, ImageSourcePropType, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../lib/theme/useTheme';

const LOCAL_LEAGUE_IMAGES: Record<number, ImageSourcePropType> = {
  345:  require('../../assets/leagues/besta-deild.png'),
  1710: require('../../assets/leagues/besta-deild.png'),
  348:  require('../../assets/leagues/lengju-deild.jpeg'),
  1711: require('../../assets/leagues/lengju-deild.jpeg'),
};

interface Props {
  type: 'league' | 'team';
  id: number;
  name: string;
  subtitle: string;
  imagePath: string;
  isLast?: boolean;
  onPress: () => void;
}

export const SearchResultRow = React.memo(function SearchResultRow({
  type,
  id,
  name,
  subtitle,
  imagePath,
  isLast,
  onPress,
}: Props) {
  const { colors } = useTheme();
  const [imgError, setImgError] = useState(false);

  const localImage = type === 'league' ? LOCAL_LEAGUE_IMAGES[id] : undefined;
  const showImage = !!localImage || (!!imagePath && !imgError);
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
        pressed && { backgroundColor: colors.surfaceSunken },
      ]}
    >
      <View
        style={[
          styles.logoWrap,
          { backgroundColor: colors.surfaceElev, borderColor: colors.border },
        ]}
      >
        {localImage ? (
          <Image source={localImage} style={styles.logo} resizeMode="contain" />
        ) : showImage ? (
          <Image
            source={{ uri: imagePath }}
            style={styles.logo}
            resizeMode="contain"
            onError={() => setImgError(true)}
          />
        ) : type === 'league' ? (
          <View style={styles.leagueFallback} />
        ) : (
          <Text style={[styles.initialsText, { color: colors.textMuted }]}>{initials}</Text>
        )}
      </View>

      <View style={styles.textWrap}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {name}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  logoWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logo: {
    width: 32,
    height: 32,
  },
  leagueFallback: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderRadius: 4,
    backgroundColor: '#02529c',
  },
  initialsText: {
    fontFamily: 'BricolageGrotesque_800ExtraBold',
    fontSize: 11,
    letterSpacing: -0.5,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
  },
  subtitle: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11.5,
  },
});
