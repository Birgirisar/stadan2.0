import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme/useTheme';
import { TeamBadge } from '../fixtures/TeamBadge';
import { formatKickoffTime, formatStartDate } from '../../lib/utils/dates';
import type { Fixture } from '../../lib/api/types';

interface Props {
  fixture: Fixture | null;
  /** Season starting_at date string — used for "Tímabilið hefst" empty state */
  seasonStart?: string | null;
}

export function NextMatchCard({ fixture, seasonStart }: Props) {
  const { colors } = useTheme();
  const router = useRouter();

  if (!fixture) {
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Næsti leikur</Text>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {seasonStart
              ? `Tímabilið hefst ${formatStartDate(seasonStart)}`
              : 'Engir leikir framundan'}
          </Text>
        </View>
      </View>
    );
  }

  const home = fixture.participants?.find((p) => p.meta.location === 'home');
  const away = fixture.participants?.find((p) => p.meta.location === 'away');

  const date = fixture.starting_at
    ? (() => {
        const d = new Date(fixture.starting_at);
        const day = d.getDate();
        const month = d.toLocaleDateString('is-IS', { month: 'long', timeZone: 'Atlantic/Reykjavik' });
        const time = formatKickoffTime(fixture.starting_at);
        return `${day}. ${month} · ${time}`;
      })()
    : null;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && { opacity: 0.75 },
      ]}
      onPress={() => router.push(`/match/${fixture.id}` as any)}
    >
      <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Næsti leikur</Text>
      {date && (
        <Text style={[styles.date, { color: colors.accent }]}>{date}</Text>
      )}
      <View style={styles.matchRow}>
        <View style={styles.teamSide}>
          <TeamBadge
            imageUrl={home?.image_path ?? ''}
            shortCode={home?.short_code ?? home?.name?.slice(0, 3) ?? '?'}
            size={32}
          />
          <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={2}>
            {home?.name ?? '—'}
          </Text>
        </View>
        {/* Fixed-width centre column ensures "vs" is always at the true midpoint */}
        <View style={styles.vsCol}>
          <Text style={[styles.vsText, { color: colors.textMuted }]}>vs</Text>
        </View>
        <View style={styles.teamSide}>
          <TeamBadge
            imageUrl={away?.image_path ?? ''}
            shortCode={away?.short_code ?? away?.name?.slice(0, 3) ?? '?'}
            size={32}
          />
          <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={2}>
            {away?.name ?? '—'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  cardLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  date: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11.5,
    letterSpacing: 0.1,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
  },
  teamSide: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  vsCol: {
    width: 32,
    height: 32,          // matches crest size — centres "vs" against the badge
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamName: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
  },
  vsText: {
    fontFamily: 'BricolageGrotesque_700Bold',
    fontSize: 13,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  emptyText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    textAlign: 'center',
  },
});
