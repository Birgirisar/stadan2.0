import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../lib/theme/useTheme';
import { TeamBadge } from '../fixtures/TeamBadge';
import type { TopScorerEntry } from '../../lib/api/teamDetail';

interface Props {
  scorers: TopScorerEntry[];
  title?: string;
}

export function TopScorersList({ scorers, title = 'Markahæstir' }: Props) {
  const { colors } = useTheme();

  if (!scorers.length) return null;

  return (
    <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
      {scorers.map((scorer, idx) => {
        const player = scorer.player;
        const name = player?.display_name ?? player?.name ?? player?.common_name ?? '—';
        const img = player?.image_path ?? '';
        const goals = scorer.total;
        const isLast = idx === scorers.length - 1;

        return (
          <View
            key={scorer.id}
            style={[
              styles.row,
              { borderColor: colors.border },
              isLast && { borderBottomWidth: 0 },
            ]}
          >
            {/* Rank */}
            <Text style={[styles.rank, { color: colors.textMuted }]}>{idx + 1}</Text>

            {/* Player crest / avatar */}
            <TeamBadge imageUrl={img} shortCode={name.slice(0, 2)} size={34} />

            {/* Name */}
            <Text style={[styles.playerName, { color: colors.text }]} numberOfLines={1}>
              {name}
            </Text>

            {/* Goals badge */}
            <View style={[styles.goalsBadge, { backgroundColor: colors.accentSoft }]}>
              <Text style={[styles.goalsText, { color: colors.accent }]}>{goals}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 14,
    marginTop: 16,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    paddingTop: 14,
  },
  title: {
    fontFamily: 'BricolageGrotesque_700Bold',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rank: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 12,
    width: 18,
    textAlign: 'center',
  },
  playerName: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13.5,
    flex: 1,
  },
  goalsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 32,
    alignItems: 'center',
  },
  goalsText: {
    fontFamily: 'BricolageGrotesque_800ExtraBold',
    fontSize: 15,
    letterSpacing: -0.3,
  },
});
