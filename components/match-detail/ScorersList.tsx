import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { FixtureEvent } from '../../lib/api/types';
import { EVENT_TYPE, formatMinute } from '../../lib/utils/events';
import { useTheme } from '../../lib/theme/useTheme';

interface Props {
  events: FixtureEvent[];
  teamId: number;
}

export function ScorersList({ events, teamId }: Props) {
  const { colors } = useTheme();

  const goals = events.filter(
    (e) =>
      (e.type_id === EVENT_TYPE.GOAL ||
        e.type_id === EVENT_TYPE.PENALTY ||
        e.type_id === EVENT_TYPE.OWN_GOAL) &&
      e.participant_id === teamId,
  );

  if (!goals.length) return null;

  // Group by player name
  const byPlayer = new Map<string, string[]>();
  for (const e of goals) {
    const name = e.player_name || 'Óþekkt';
    if (!byPlayer.has(name)) byPlayer.set(name, []);
    byPlayer.get(name)!.push(formatMinute(e));
  }

  return (
    <View style={styles.list}>
      {[...byPlayer.entries()].map(([name, minutes]) => (
        <View key={name} style={styles.row}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {abbreviateName(name)}
          </Text>
          <Text style={[styles.mins, { color: colors.textMuted }]}>{minutes.join(', ')}</Text>
        </View>
      ))}
    </View>
  );
}

function abbreviateName(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length <= 1) return name;
  // Keep last name full, abbreviate first/middle names
  const last = parts[parts.length - 1];
  const abbrevs = parts.slice(0, -1).map((p) => p[0] + '.');
  return [...abbrevs, last].join(' ');
}

const styles = StyleSheet.create({
  list: { gap: 3, alignItems: 'center', width: '100%', marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'baseline', gap: 4, flexWrap: 'wrap', justifyContent: 'center' },
  name: { fontFamily: 'Manrope_600SemiBold', fontSize: 11, letterSpacing: -0.1 },
  mins: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 10, letterSpacing: -0.2 },
});
