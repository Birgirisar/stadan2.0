import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { FixtureEvent } from '../../lib/api/types';
import { buildTimeline } from '../../lib/utils/events';
import { useTheme } from '../../lib/theme/useTheme';
import { EventRow } from './EventRow';

interface Props {
  events: FixtureEvent[];
  homeTeamId: number;
  homeGoals: number | null;
  awayGoals: number | null;
  isFinished: boolean;
}

export function EventTimeline({ events, homeTeamId, homeGoals, awayGoals, isFinished }: Props) {
  const { colors } = useTheme();

  if (!events.length) return null;

  const items = buildTimeline(events, homeTeamId, homeGoals, awayGoals, isFinished);

  if (!items.length) return null;

  return (
    <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Atburðir</Text>
      </View>
      <View style={styles.timeline}>
        {/* Center line */}
        <View style={[styles.centerLine, { backgroundColor: colors.border }]} />
        {items.map((item, idx) => {
          if (item.kind === 'divider') {
            return (
              <View key={`div-${idx}`} style={styles.dividerRow}>
                <View style={[styles.dividerPill, { backgroundColor: colors.surfaceSunken, borderColor: colors.border }]}>
                  <Text style={[styles.dividerText, { color: colors.textSecondary }]}>{item.label}</Text>
                </View>
              </View>
            );
          }
          return (
            <EventRow key={item.event.id} event={item.event} side={item.side} />
          );
        })}
      </View>
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
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontFamily: 'BricolageGrotesque_700Bold',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  timeline: {
    paddingBottom: 12,
    position: 'relative',
  },
  centerLine: {
    position: 'absolute',
    top: 8,
    bottom: 8,
    left: '50%',
    width: 2,
    marginLeft: -1,
  },
  dividerRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    zIndex: 2,
  },
  dividerPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  dividerText: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 10.5,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
