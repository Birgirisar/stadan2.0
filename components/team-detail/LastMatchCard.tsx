import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme/useTheme';
import { TeamBadge } from '../fixtures/TeamBadge';
import { getScore } from '../../lib/utils/score';
import { formatKickoffTime } from '../../lib/utils/dates';
import { getMatchState, getLiveMinute } from '../../lib/utils/state';
import type { Fixture } from '../../lib/api/types';

function PulseDot({ color }: { color: string }) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.3, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 750, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color, opacity }}
    />
  );
}

interface Props {
  fixture: Fixture | null;
  teamId: number;
}

export function LastMatchCard({ fixture, teamId }: Props) {
  const { colors } = useTheme();
  const router = useRouter();

  if (!fixture) {
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Síðasti leikur</Text>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Engir leikir spilaðir
          </Text>
        </View>
      </View>
    );
  }

  const home = fixture.participants?.find((p) => p.meta.location === 'home');
  const away = fixture.participants?.find((p) => p.meta.location === 'away');
  const score = getScore(fixture);
  const isHome = home?.id === teamId;

  const stateResult = getMatchState(fixture.state);
  // Schedule endpoint doesn't include the `state` object — fall back to state_id
  // (mirrors LIVE_STATE_IDS / HALFTIME in useTeamDetail)
  const LIVE_IDS = new Set([2, 3, 25]);   // 1H, 2H, ET
  const HT_IDS   = new Set([13]);          // Half-time break
  const isLive =
    stateResult.type === 'live' || stateResult.type === 'halftime' ||
    LIVE_IDS.has(fixture.state_id) || HT_IDS.has(fixture.state_id);
  const isHalftime = stateResult.type === 'halftime' || HT_IDS.has(fixture.state_id);
  const liveMinute = getLiveMinute(fixture.periods);

  // Result colour from this team's perspective
  let resultColor = isLive ? colors.live : colors.draw;
  const hg = score.home ?? 0;
  const ag = score.away ?? 0;
  if (!isLive && hg !== ag) {
    const teamWon = isHome ? hg > ag : ag > hg;
    resultColor = teamWon ? colors.win : colors.loss;
  }

  // Same date format as NextMatchCard
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
        {
          backgroundColor: colors.surface,
          borderColor: isLive ? colors.live + '55' : colors.border,
        },
        pressed && { opacity: 0.75 },
      ]}
      onPress={() => router.push(`/match/${fixture.id}` as any)}
    >
      <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Síðasti leikur</Text>

      {isLive ? (
        <View style={styles.liveRow}>
          <PulseDot color={colors.live} />
          <Text style={[styles.liveLabel, { color: colors.live }]}>
            {isHalftime
              ? 'Hlétími'
              : liveMinute
              ? `Í beinni · ${liveMinute}`
              : 'Í beinni'}
          </Text>
        </View>
      ) : (
        date && <Text style={[styles.date, { color: colors.accent }]}>{date}</Text>
      )}

      {/* Same two-column layout as NextMatchCard; score replaces "vs" */}
      <View style={styles.matchRow}>
        <View style={styles.teamSide}>
          <TeamBadge
            imageUrl={home?.image_path ?? ''}
            shortCode={home?.short_code ?? home?.name?.slice(0, 3) ?? '?'}
            size={32}
            teamId={home?.id}
          />
          <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={2}>
            {home?.name ?? '—'}
          </Text>
        </View>

        {/* Fixed-width centre column — wider than "vs" to fit score digits */}
        <View style={styles.scoreCol}>
          <Text style={[styles.scoreText, { color: resultColor }]}>
            {score.home ?? '—'} – {score.away ?? '—'}
          </Text>
        </View>

        <View style={styles.teamSide}>
          <TeamBadge
            imageUrl={away?.image_path ?? ''}
            shortCode={away?.short_code ?? away?.name?.slice(0, 3) ?? '?'}
            size={32}
            teamId={away?.id}
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
  // ── Shared with NextMatchCard ──────────────────────────────────────────────
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
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  liveLabel: {
    fontFamily: 'Manrope_700Bold',
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
  teamName: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
  },

  // ── LastMatchCard-specific ─────────────────────────────────────────────────
  // Wider than NextMatchCard's vsCol (32 px) to fit score digits comfortably.
  // height: 32 matches the crest size so the score stays centred against the badge.
  scoreCol: {
    width: 48,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 13,
    letterSpacing: -0.3,
    textAlign: 'center',
  },

  // ── Empty state ────────────────────────────────────────────────────────────
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
