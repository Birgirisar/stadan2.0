import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../lib/theme/useTheme';

interface Props {
  playerName: string;
  teamName: string;
  position?: string | null;
  rating?: number | null;
}

export function ManOfTheMatchCard({ playerName, teamName, position, rating }: Props) {
  const { colors } = useTheme();

  const initials = playerName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('');

  const positionStr = [teamName, position].filter(Boolean).join(' · ');

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.gold + '4d',
          shadowColor: colors.gold,
        },
      ]}
    >
      {/* Gold gradient tint strip */}
      <View style={[styles.tintOverlay, { backgroundColor: colors.gold + '18' }]} pointerEvents="none" />

      <View style={[styles.avatar, { backgroundColor: colors.surfaceSunken, borderColor: colors.gold + '66' }]}>
        <Text style={[styles.initials, { color: colors.textSecondary }]}>{initials}</Text>
      </View>

      <View style={styles.textBlock}>
        <View style={styles.labelRow}>
          <StarIcon color={colors.gold} />
          <Text style={[styles.motmLabel, { color: colors.gold }]}>Maður leiksins</Text>
        </View>
        <Text style={[styles.playerName, { color: colors.text }]} numberOfLines={1}>
          {playerName}
        </Text>
        {!!positionStr && (
          <Text style={[styles.teamName, { color: colors.textMuted }]} numberOfLines={1}>
            {positionStr}
          </Text>
        )}
      </View>

      {rating != null && (
        <View style={[styles.ratingBadge, { backgroundColor: colors.gold }]}>
          <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
        </View>
      )}
    </View>
  );
}

function StarIcon({ color }: { color: string }) {
  // Unicode star is sufficient here
  return <Text style={{ fontSize: 11, color, lineHeight: 14 }}>★</Text>;
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 14,
    marginTop: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    paddingRight: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  tintOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  initials: {
    fontFamily: 'BricolageGrotesque_800ExtraBold',
    fontSize: 17,
    letterSpacing: -0.5,
  },
  textBlock: { flex: 1, gap: 2, minWidth: 0 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 1 },
  motmLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 10.5,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  playerName: {
    fontFamily: 'BricolageGrotesque_700Bold',
    fontSize: 17,
    letterSpacing: -0.3,
    lineHeight: 20,
  },
  teamName: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    marginTop: 1,
  },
  ratingBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexShrink: 0,
  },
  ratingText: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 17,
    color: '#fff',
    letterSpacing: -0.3,
  },
});
