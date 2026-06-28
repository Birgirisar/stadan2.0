import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme/useTheme';
import { formatKickoffTime, formatMatchDate } from '../../lib/utils/dates';
import { getScore } from '../../lib/utils/score';
import { getMatchState, getLiveMinute } from '../../lib/utils/state';
import { EVENT_TYPE } from '../../lib/utils/events';
import type { Fixture } from '../../lib/api/types';
import { TeamBadge } from './TeamBadge';

interface Props {
  fixture: Fixture;
  isLast: boolean;
  showDate?: boolean;
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

export function MatchRow({ fixture, isLast, showDate }: Props) {
  const { colors } = useTheme();
  const router = useRouter();

  const home = fixture.participants?.find((p) => p.meta.location === 'home');
  const away = fixture.participants?.find((p) => p.meta.location === 'away');
  const stateResult = getMatchState(fixture.state);
  const score = getScore(fixture);
  const liveMinute = getLiveMinute(fixture.periods);

  const homeIsLoser = false;
  const awayIsLoser = false;

  const homeRedCards = (fixture.events ?? []).filter(
    (e) => (e.type_id === EVENT_TYPE.RED_CARD || e.type_id === EVENT_TYPE.YELLOW_RED) &&
      e.participant_id === home?.id,
  ).length;
  const awayRedCards = (fixture.events ?? []).filter(
    (e) => (e.type_id === EVENT_TYPE.RED_CARD || e.type_id === EVENT_TYPE.YELLOW_RED) &&
      e.participant_id === away?.id,
  ).length;
  const hasRedCards = stateResult.showScore && (homeRedCards > 0 || awayRedCards > 0);

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
          liveMinute ? (
            <View style={styles.liveMinuteRow}>
              <PulseDot color={colors.live} />
              <Text style={[styles.minuteText, { color: colors.live }]}>{liveMinute}</Text>
            </View>
          ) : (
            <PulseDot color={colors.live} />
          )
        ) : (
          <View style={styles.statusStack}>
            {showDate && (
              <Text style={[styles.dateText, { color: colors.textMuted }]} numberOfLines={1}>
                {formatMatchDate(fixture.starting_at)}
              </Text>
            )}
            {stateResult.label ? (
              <Text
                style={[
                  styles.statusText,
                  { color: stateResult.type === 'cancelled' ? colors.live : colors.textMuted },
                ]}
              >
                {stateResult.label}
              </Text>
            ) : null}
          </View>
        )}
      </View>

      {/* Home team — flex 1, right-aligned */}
      <View style={[styles.teamHome, homeIsLoser && styles.loser]}>
        <Text
          style={[styles.teamName, styles.teamNameHome, { color: homeIsLoser ? colors.textMuted : colors.text }]}
          numberOfLines={2}
        >
          {home?.name ?? ''}
        </Text>
        <TeamBadge imageUrl={home?.image_path ?? ''} shortCode={home?.short_code ?? ''} teamId={home?.id} />
      </View>

      {/* Center — 54px */}
      <View style={styles.centerCol}>
        {stateResult.showScore ? (
          <View style={styles.scoreWithCards}>
            {/* Home digit — card floats above it */}
            <View style={styles.digitCol}>
              {hasRedCards && (homeRedCards > 0
                ? <View style={styles.tinyCardRow}>
                    {Array.from({ length: homeRedCards }, (_, i) => (
                      <View key={i} style={[styles.tinyCard, i > 0 && styles.tinyCardOverlap]} />
                    ))}
                  </View>
                : <View style={styles.cardSpacer} />
              )}
              <Text style={[styles.score, { color: colors.text }]}>{score.home ?? '-'}</Text>
            </View>
            {/* Dash */}
            <Text style={[styles.score, { color: colors.textMuted }]}> – </Text>
            {/* Away digit — card floats above it */}
            <View style={styles.digitCol}>
              {hasRedCards && (awayRedCards > 0
                ? <View style={styles.tinyCardRow}>
                    {Array.from({ length: awayRedCards }, (_, i) => (
                      <View key={i} style={[styles.tinyCard, i > 0 && styles.tinyCardOverlap]} />
                    ))}
                  </View>
                : <View style={styles.cardSpacer} />
              )}
              <Text style={[styles.score, { color: colors.text }]}>{score.away ?? '-'}</Text>
            </View>
          </View>
        ) : stateResult.type === 'pending' ? (
          <Text style={[styles.time, { color: colors.textSecondary }]}>
            {formatKickoffTime(fixture.starting_at)}
          </Text>
        ) : stateResult.type === 'cancelled' ? (
          <Text style={[styles.time, styles.cancelledTime, { color: colors.textMuted }]}>
            {formatKickoffTime(fixture.starting_at)}
          </Text>
        ) : null}
      </View>

      {/* Away team — flex 1, left-aligned */}
      <View style={[styles.teamAway, awayIsLoser && styles.loser]}>
        <TeamBadge imageUrl={away?.image_path ?? ''} shortCode={away?.short_code ?? ''} teamId={away?.id} />
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
  statusStack: {
    alignItems: 'center',
    gap: 2,
  },
  statusText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  dateText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 9,
    textAlign: 'center',
    letterSpacing: 0.1,
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
  liveMinuteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  minuteText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    letterSpacing: 0.2,
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
  cancelledTime: {
    textDecorationLine: 'line-through',
    opacity: 0.45,
  },
  scoreWithCards: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  digitCol: {
    alignItems: 'center',
  },
  tinyCardRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  tinyCard: {
    width: 5,
    height: 7,
    borderRadius: 1,
    backgroundColor: '#d63031',
  },
  tinyCardOverlap: {
    marginLeft: 2,
  },
  cardSpacer: {
    height: 9,
  },
});
