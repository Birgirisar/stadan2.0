import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LEAGUES } from '../../constants/leagues';
import { useTheme } from '../../lib/theme/useTheme';
import type { Fixture } from '../../lib/api/types';
import { MatchRow } from './MatchRow';

interface Props {
  leagueId: number;
  fixtures: Fixture[];
  roundName?: string;
  /** Aggregate scoreline per fixture id, for two-legged play-off ties. See useAggregateScores. */
  aggregateByFixtureId?: Map<number, string>;
}

function sortFixtures(fixtures: Fixture[]): Fixture[] {
  return [...fixtures].sort((a, b) => {
    const aLive = a.state?.is_live ? 0 : 1;
    const bLive = b.state?.is_live ? 0 : 1;
    if (aLive !== bLive) return aLive - bLive;
    return a.starting_at_timestamp - b.starting_at_timestamp;
  });
}

export function LeagueSection({ leagueId, fixtures, roundName, aggregateByFixtureId }: Props) {
  const { colors } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const rotation = useRef(new Animated.Value(0)).current;

  const hasLive = fixtures.some((f) => f.state?.is_live);
  const leagueInfo = LEAGUES[leagueId as keyof typeof LEAGUES];
  const displayName = leagueInfo?.displayName ?? fixtures[0]?.league?.name ?? 'Deild';
  const sorted = sortFixtures(fixtures);

  const toggle = () => {
    Animated.timing(rotation, {
      toValue: collapsed ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setCollapsed((c) => !c);
  };

  const chevronRotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-180deg'],
  });

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: hasLive ? colors.liveBorder : colors.border,
        },
        hasLive && {
          shadowColor: colors.live,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.18,
          shadowRadius: 8,
          elevation: 4,
        },
      ]}
    >
      <TouchableOpacity
        onPress={toggle}
        activeOpacity={0.7}
        style={[
          styles.leagueHeader,
          { borderBottomColor: colors.border },
          collapsed && styles.leagueHeaderCollapsed,
        ]}
      >
        <View style={styles.leagueInfo}>
          <View style={styles.flagCircle} />
          <View>
            <Text style={[styles.leagueName, { color: colors.text }]}>{displayName}</Text>
            <Text style={[styles.leagueSub, { color: colors.textMuted }]}>
              {roundName ? `Ísland · Umferð ${roundName}` : 'Ísland'}
            </Text>
          </View>
        </View>
        <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
          <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
        </Animated.View>
      </TouchableOpacity>

      {!collapsed && sorted.map((fixture, i) => (
        <MatchRow
          key={fixture.id}
          fixture={fixture}
          isLast={i === sorted.length - 1}
          aggregateLabel={aggregateByFixtureId?.get(fixture.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 14,
    marginBottom: 14,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  leagueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  leagueHeaderCollapsed: {
    borderBottomWidth: 0,
  },
  leagueInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  flagCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#02529c',
    overflow: 'hidden',
  },
  leagueName: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13.5,
    letterSpacing: -0.1,
  },
  leagueSub: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 10.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 1,
  },
});
