import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme/useTheme';
import { TeamBadge } from '../fixtures/TeamBadge';
import type { TeamBrief } from '../../lib/api/teams';

interface Props {
  teams: TeamBrief[];
}

export function LeagueTeamsList({ teams }: Props) {
  const { colors } = useTheme();
  const router = useRouter();

  if (!teams.length) {
    return (
      <View style={styles.empty}>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>Engin lið fundust</Text>
      </View>
    );
  }

  const sorted = [...teams].sort((a, b) => a.name.localeCompare(b.name, 'is'));

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {sorted.map((team, idx) => (
        <Pressable
          key={team.id}
          onPress={() => router.push(`/team/${team.id}` as any)}
          style={({ pressed }) => [
            styles.row,
            {
              borderBottomColor: colors.border,
              borderBottomWidth: idx === sorted.length - 1 ? 0 : StyleSheet.hairlineWidth,
            },
            pressed && { opacity: 0.65 },
          ]}
        >
          <TeamBadge
            imageUrl={team.image_path ?? ''}
            shortCode={team.short_code ?? team.name.slice(0, 3)}
            size={30}
            teamId={team.id}
          />
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {team.name}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 14,
    marginTop: 16,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  name: {
    flex: 1,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
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
