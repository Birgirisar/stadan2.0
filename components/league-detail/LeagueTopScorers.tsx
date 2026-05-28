import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/theme/useTheme';
import { TeamBadge } from '../fixtures/TeamBadge';
import type { TopScorerEntry } from '../../lib/api/teamDetail';

const DEFAULT_SHOWN = 5;

interface CardProps {
  title: string;
  entries: TopScorerEntry[];
}

function StatCard({ title, entries }: CardProps) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  if (!entries.length) return null;

  const visible = expanded ? entries : entries.slice(0, DEFAULT_SHOWN);
  const canExpand = entries.length > DEFAULT_SHOWN;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <TouchableOpacity
        onPress={() => setExpanded((e) => !e)}
        activeOpacity={0.7}
        style={styles.header}
      >
        <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.textMuted}
        />
      </TouchableOpacity>
      {visible.map((entry, idx) => {
        const player = entry.player;
        const team = entry.participant;
        const name = player?.display_name ?? player?.name ?? player?.common_name ?? '—';
        const playerImg = player?.image_path ?? '';
        const teamImg = team?.image_path ?? '';
        const teamCode = team?.short_code ?? team?.name?.slice(0, 3) ?? '?';

        return (
          <View key={entry.id} style={[styles.row, { borderColor: colors.border }]}>
            <Text style={[styles.rank, { color: colors.textMuted }]}>{idx + 1}</Text>
            <TeamBadge imageUrl={playerImg} shortCode={name.slice(0, 2)} size={34} />
            <Text style={[styles.playerName, { color: colors.text }]} numberOfLines={1}>
              {name}
            </Text>
            <TeamBadge imageUrl={teamImg} shortCode={teamCode} size={22} />
            <View style={[styles.badge, { backgroundColor: colors.accentSoft }]}>
              <Text style={[styles.badgeText, { color: colors.accent }]}>{entry.total}</Text>
            </View>
          </View>
        );
      })}
      {canExpand && (
        <TouchableOpacity
          onPress={() => setExpanded((e) => !e)}
          activeOpacity={0.7}
          style={[styles.expandBtn, { borderColor: colors.border }]}
        >
          <Text style={[styles.expandText, { color: colors.textSecondary }]}>
            {expanded ? 'Sýna færri' : `Sýna alla (${entries.length})`}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

interface Props {
  scorers: TopScorerEntry[];
}

export function LeagueTopScorers({ scorers }: Props) {
  const { colors } = useTheme();

  const goals = scorers.filter((s) => s.type_id === 208).sort((a, b) => b.total - a.total);
  const assists = scorers.filter((s) => s.type_id === 209).sort((a, b) => b.total - a.total);

  if (!goals.length && !assists.length) {
    return (
      <View style={styles.empty}>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>Engar upplýsingar</Text>
      </View>
    );
  }

  return (
    <>
      <StatCard title="Markahæstir" entries={goals} />
      <StatCard title="Stoðsendingar" entries={assists} />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 14,
    marginTop: 16,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    paddingTop: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  title: {
    fontFamily: 'BricolageGrotesque_700Bold',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
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
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 32,
    alignItems: 'center',
  },
  badgeText: {
    fontFamily: 'BricolageGrotesque_800ExtraBold',
    fontSize: 15,
    letterSpacing: -0.3,
  },
  expandBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  expandText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 15,
  },
});
