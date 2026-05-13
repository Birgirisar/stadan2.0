import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme/useTheme';
import { formatKickoffTime } from '../../lib/utils/dates';
import { getScore } from '../../lib/utils/score';
import { getMatchState } from '../../lib/utils/state';
import type { Fixture } from '../../lib/api/types';
import { TeamBadge } from './TeamBadge';

interface Props {
  fixture: Fixture;
  isLast: boolean;
}

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

export function MatchRow({ fixture, isLast }: Props) {
  const { colors } = useTheme();
  const router = useRouter();

  const home = fixture.participants?.find((p) => p.meta.location === 'home');
  const away = fixture.participants?.find((p) => p.meta.location === 'away');
  const stateResult = getMatchState(fixture.state);
  const score = getScore(fixture);

  const homeIsLoser = false;
  const awayIsLoser = false;

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
      {/* Status — 40px */}
      <View style={styles.statusCol}>
        {stateResult.type === 'live' ? (
          <PulseDot color={colors.live} />
        ) : stateResult.label ? (
          <Text
            style={[
              styles.statusText,
              {
                color:
                  stateResult.type === 'halftime'
                    ? colors.textMuted
                    : stateResult.type === 'finished'
                    ? colors.textMuted
                    : stateResult.type === 'cancelled'
                    ? colors.live
                    : colors.textMuted,
              },
            ]}
          >
            {stateResult.label}
          </Text>
        ) : null}
      </View>

      {/* Home team — flex 1, right-aligned */}
      <View style={[styles.teamHome, homeIsLoser && styles.loser]}>
        <Text
          style={[styles.teamName, styles.teamNameHome, { color: homeIsLoser ? colors.textMuted : colors.text }]}
          numberOfLines={2}
        >
          {home?.name ?? ''}
        </Text>
        <TeamBadge imageUrl={home?.image_path ?? ''} shortCode={home?.short_code ?? ''} />
      </View>

      {/* Center — 54px */}
      <View style={styles.centerCol}>
        {stateResult.showScore ? (
          <Text style={[styles.score, { color: colors.text }]}>
            {score.home ?? '-'}
            <Text style={{ color: colors.textMuted }}> – </Text>
            {score.away ?? '-'}
          </Text>
        ) : stateResult.type === 'pending' ? (
          <Text style={[styles.time, { color: colors.textSecondary }]}>
            {formatKickoffTime(fixture.starting_at)}
          </Text>
        ) : null}
      </View>

      {/* Away team — flex 1, left-aligned */}
      <View style={[styles.teamAway, awayIsLoser && styles.loser]}>
        <TeamBadge imageUrl={away?.image_path ?? ''} shortCode={away?.short_code ?? ''} />
        <Text
          style={[styles.teamName, { color: awayIsLoser ? colors.textMuted : colors.text }]}
          numberOfLines={2}
        >
          {away?.name ?? ''}
        </Text>
      </View>

      {/* Right spacer — balances the 40px statusCol on the left so center column sits at true center */}
      <View style={styles.spacer} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingLeft: 14,
    paddingRight: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  statusCol: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  teamHome: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    overflow: 'hidden',
  },
  teamAway: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    overflow: 'hidden',
  },
  loser: {
    opacity: 0.55,
  },
  teamName: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13.5,
    flexShrink: 1,
  },
  teamNameHome: {
    textAlign: 'right',
  },
  spacer: {
    width: 36,
  },
  centerCol: {
    width: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 16,
    letterSpacing: -0.3,
  },
  time: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 12.5,
    letterSpacing: -0.2,
  },
});
