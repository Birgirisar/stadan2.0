import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../lib/theme/useTheme';
import { getScore } from '../../../lib/utils/score';
import { formatStartDate } from '../../../lib/utils/dates';
import { TeamBadge } from '../../fixtures/TeamBadge';
import type { Fixture } from '../../../lib/api/types';

interface Props {
  fixture: Fixture;
  isLast: boolean;
}

export function H2HMatchRow({ fixture, isLast }: Props) {
  const { colors } = useTheme();
  const router = useRouter();

  const home = fixture.participants?.find((p) => p.meta.location === 'home');
  const away = fixture.participants?.find((p) => p.meta.location === 'away');
  const score = getScore(fixture);
  const dateLabel = formatStartDate(fixture.starting_at);

  return (
    <Pressable
      onPress={() => router.push(`/match/${fixture.id}` as any)}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: colors.border },
        isLast && styles.lastRow,
        pressed && { opacity: 0.6 },
      ]}
    >
      {/* Date — left column */}
      <View style={styles.dateCol}>
        <Text style={[styles.dateText, { color: colors.textMuted }]} numberOfLines={1}>
          {dateLabel}
        </Text>
      </View>

      {/* Match center — home · score · away */}
      <View style={styles.matchCol}>
        {/* Home team */}
        <View style={styles.teamHome}>
          <Text style={[styles.teamName, styles.teamNameRight, { color: colors.text }]} numberOfLines={1}>
            {home?.name ?? ''}
          </Text>
          <TeamBadge imageUrl={home?.image_path ?? ''} shortCode={home?.short_code ?? ''} size={18} />
        </View>

        {/* Score */}
        <View style={styles.scoreBox}>
          <Text style={[styles.score, { color: colors.text }]}>
            {score.home ?? '-'}
            <Text style={{ color: colors.textMuted }}>–</Text>
            {score.away ?? '-'}
          </Text>
        </View>

        {/* Away team */}
        <View style={styles.teamAway}>
          <TeamBadge imageUrl={away?.image_path ?? ''} shortCode={away?.short_code ?? ''} size={18} />
          <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={1}>
            {away?.name ?? ''}
          </Text>
        </View>
      </View>

      {/* Chevron — right column */}
      <View style={styles.chevronCol}>
        <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  dateCol: {
    width: 64,
  },
  dateText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
  },
  matchCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  teamHome: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 5,
    overflow: 'hidden',
  },
  teamAway: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 5,
    overflow: 'hidden',
  },
  teamName: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12.5,
    flexShrink: 1,
  },
  teamNameRight: {
    textAlign: 'right',
  },
  scoreBox: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 13,
    letterSpacing: -0.3,
  },
  chevronCol: {
    width: 18,
    alignItems: 'center',
  },
});
