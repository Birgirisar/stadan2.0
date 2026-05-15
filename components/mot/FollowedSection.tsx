import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { LeagueSummary } from '../../lib/api/types';
import { useTheme } from '../../lib/theme/useTheme';
import { LeagueCard } from './LeagueCard';

interface Props {
  summaries: LeagueSummary[];
  followedIds: number[];
  onPress: (leagueId: number) => void;
}

export function FollowedSection({ summaries, followedIds, onPress }: Props) {
  const { colors } = useTheme();
  const followed = summaries.filter((s) => followedIds.includes(s.leagueId));

  return (
    <>
      <View style={styles.heading}>
        <Text style={[styles.headingText, { color: colors.textSecondary }]}>
          Þú fylgist með
        </Text>
      </View>

      {followed.length === 0 ? (
        <View
          style={[
            styles.emptyCard,
            { backgroundColor: colors.surface, borderColor: colors.borderStrong },
          ]}
        >
          <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceSunken }]}>
            <Ionicons name="star-outline" size={18} color={colors.textMuted} />
          </View>
          <View style={styles.emptyText}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Engar deildir ennþá
            </Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>
              Smelltu á „Fylgjast" í deildarsíðu til að bæta hér við.
            </Text>
          </View>
        </View>
      ) : (
        followed.map((s) => (
          <LeagueCard
            key={s.leagueId}
            summary={s}
            isFollowed
            onPress={() => onPress(s.leagueId)}
          />
        ))
      )}
    </>
  );
}

const styles = StyleSheet.create({
  heading: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headingText: {
    fontFamily: 'BricolageGrotesque_700Bold',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.78,
  },
  emptyCard: {
    marginHorizontal: 14,
    marginBottom: 8,
    padding: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emptyIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  emptyText: {
    flex: 1,
    minWidth: 0,
  },
  emptyTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    marginBottom: 2,
  },
  emptySub: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11.5,
    lineHeight: 16,
  },
});
