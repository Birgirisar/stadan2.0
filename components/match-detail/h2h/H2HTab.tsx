import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../lib/theme/useTheme';
import { useHeadToHead } from '../../../lib/hooks/useHeadToHead';
import { H2HSummaryCard } from './H2HSummaryCard';
import { H2HMatchList } from './H2HMatchList';
import type { Participant } from '../../../lib/api/types';

interface Props {
  homeTeam: Participant | undefined;
  awayTeam: Participant | undefined;
  currentFixtureId: number;
}

export function H2HTab({ homeTeam, awayTeam, currentFixtureId }: Props) {
  const { colors } = useTheme();
  const { data, isLoading, error, refetch } = useHeadToHead(
    homeTeam?.id,
    awayTeam?.id,
    currentFixtureId,
  );

  if (isLoading) {
    return <H2HSkeleton colors={colors} />;
  }

  if (error) {
    return (
      <View style={styles.errorRow}>
        <Text style={[styles.errorText, { color: colors.textMuted }]}>
          Tókst ekki að sækja innbyrðis gögn
        </Text>
        <Pressable
          onPress={() => refetch()}
          style={[styles.retryBtn, { borderColor: colors.border }]}
        >
          <Text style={[styles.retryText, { color: colors.text }]}>Reyna aftur</Text>
        </Pressable>
      </View>
    );
  }

  if (!data || data.meetings.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.emptyIconWrap, { backgroundColor: colors.surfaceElev }]}>
            <Ionicons name="git-compare-outline" size={22} color={colors.textMuted} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Engir fyrri fundir tiltækir
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            Þetta er fyrsti leikur þessara liða á okkar gögnum.
          </Text>
        </View>
      </View>
    );
  }

  if (!homeTeam || !awayTeam) return null;

  return (
    <View style={styles.container}>
      <H2HSummaryCard
        summary={data.summary}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
      />
      <H2HMatchList meetings={data.meetings} />
      <View style={styles.bottomPad} />
    </View>
  );
}

function H2HSkeleton({ colors }: { colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <View style={[styles.skeletonContainer, { marginHorizontal: 14, marginTop: 16 }]}>
      {/* Summary card skeleton */}
      <View style={[styles.skeletonCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.skeletonLine, styles.skeletonFull, { backgroundColor: colors.surfaceElev }]} />
        <View style={[styles.skeletonLine, styles.skeletonBar, { backgroundColor: colors.surfaceElev }]} />
      </View>

      {/* Match rows skeleton */}
      <View style={{ marginTop: 24 }}>
        <View style={[styles.skeletonLabel, { backgroundColor: colors.surfaceElev }]} />
        <View style={[styles.skeletonCard, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 8 }]}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={[styles.skeletonRow, { borderBottomColor: colors.border, borderBottomWidth: i < 3 ? StyleSheet.hairlineWidth : 0 }]}>
              <View style={[styles.skeletonPill, { backgroundColor: colors.surfaceElev, width: 50 }]} />
              <View style={[styles.skeletonPill, { backgroundColor: colors.surfaceElev, flex: 1 }]} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  errorRow: {
    marginHorizontal: 14,
    marginTop: 20,
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  retryText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
  },
  emptyContainer: {
    marginHorizontal: 14,
    marginTop: 20,
  },
  emptyCard: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 28,
    alignItems: 'center',
    gap: 10,
  },
  emptyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: 'BricolageGrotesque_800ExtraBold',
    fontSize: 15,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 17,
  },
  bottomPad: {
    height: 24,
  },
  // Skeleton
  skeletonContainer: {},
  skeletonCard: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 12,
  },
  skeletonLine: {
    height: 14,
    borderRadius: 7,
    opacity: 0.5,
  },
  skeletonFull: {
    width: '100%',
    height: 60,
    borderRadius: 10,
  },
  skeletonBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
  },
  skeletonLabel: {
    width: 60,
    height: 12,
    borderRadius: 6,
    opacity: 0.5,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  skeletonPill: {
    height: 10,
    borderRadius: 5,
    opacity: 0.5,
  },
});
