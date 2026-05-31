import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { FixtureEvent } from '../../lib/api/types';
import { EVENT_TYPE, formatMinute, getEventLabel } from '../../lib/utils/events';
import { useTheme } from '../../lib/theme/useTheme';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  event: FixtureEvent;
  side: 'home' | 'away';
}

function GoalIcon({ color }: { color: string }) {
  return (
    <Ionicons style={[styles.icon]} name="football" size={14} color={color} />  
  );
}

function CardIcon({ color, style }: { color: string; style?: any }) {
  return (
    <View style={[styles.card, { backgroundColor: color }, style]} />
  );
}

function SubIcon({ color, direction }: { color: string; direction: 'in' | 'out' }) {
  return (
    <View style={styles.subIconWrap}>
      <View style={[styles.subArrow, { borderColor: color, transform: [{ rotate: direction === 'in' ? '-45deg' : '135deg' }] }]} />
    </View>
  );
}

function EventIcon({ iconType, colors }: { iconType: string; colors: ReturnType<typeof import('../../lib/theme/useTheme').useTheme>['colors'] }) {
  switch (iconType) {
    case 'goal':
    case 'missed-pen':
      return <GoalIcon color={colors.text} />;
    case 'pen-goal':
      return <GoalIcon color={colors.accent} />;
    case 'own-goal':
      return <GoalIcon color={colors.loss} />;
    case 'yellow':
      return <CardIcon color="#f5c518" />;
    case 'red':
      return <CardIcon color="#d63031" />;
    case 'yellow-red':
      return (
        <View style={{ flexDirection: 'row', gap: 2 }}>
          <CardIcon color="#f5c518" style={styles.yellowCard} />
          <CardIcon color="#d63031" style={styles.redCard} />
        </View>
      );
    case 'sub':
      return <SubIcon color={colors.accent} direction="in" />;
    default:
      return <GoalIcon color={colors.text} />;
  }
}

export function EventRow({ event, side }: Props) {
  const { colors } = useTheme();
  const { line1Sub, iconType } = getEventLabel(event);
  const playerName = event.player_name || event.player?.name || 'Óþekkt';
  const minuteStr = formatMinute(event);
  const isHome = side === 'home';
  const isSub = event.type_id === EVENT_TYPE.SUBSTITUTION;
  const playerOffName = isSub
    ? (event.related_player_name || event.related_player?.name || null)
    : null;

  const content = (
    <View style={[styles.content, isHome ? styles.contentHome : styles.contentAway]}>
      {/* Player on (or main player for non-sub events) */}
      <View style={[styles.line1, isHome ? styles.line1Home : styles.line1Away]}>
        <EventIcon iconType={iconType} colors={colors} />
        <Text
          style={[styles.playerName, { color: colors.text }]}
          numberOfLines={1}
        >
          {formatName(playerName, "full")}
        </Text>
      </View>
      {/* Sub: player going off */}
      {isSub && !!playerOffName && (
        <View style={[styles.line1, isHome ? styles.line1Home : styles.line1Away]}>
          <SubIcon color="#d63031" direction="out" />
          <Text
            style={[styles.playerName, { color: colors.textMuted }]}
            numberOfLines={1}
          >
            {formatName(playerOffName, "full")}
          </Text>
        </View>
      )}
      {/* Non-sub subtitle (assist, card label, etc.) */}
      {!isSub && !!line1Sub && (
        <Text
          style={[styles.line2, { color: colors.textMuted }, isHome ? styles.textRight : styles.textLeft]}
          numberOfLines={1}
        >
          {line1Sub}
        </Text>
      )}
    </View>
  );

  const minuteCircle = (
    <View style={[styles.minuteCircle, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <Text style={[styles.minuteText, { color: colors.text }]}>{minuteStr}</Text>
    </View>
  );

  return (
    <View style={styles.row}>
      {isHome ? content : <View style={styles.spacer} />}
      {minuteCircle}
      {isHome ? <View style={styles.spacer} /> : content}
    </View>
  );
}

function formatName(name: string, mode: "full" | "compact" | "scoreboard") {
  const parts = name.trim().split(" ");
  if (parts.length <= 1) return name;

  const last = parts[parts.length - 1];

  switch (mode) {
    case "full":
      return name;

    case "compact":
      return `${parts[0][0]}. ${last}`;

    case "scoreboard":
      return last;

    default:
      return name;
  }
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
  },
  spacer: { flex: 1 },
  content: { flex: 1, gap: 2 },
  contentHome: { alignItems: 'flex-end' },
  contentAway: { alignItems: 'flex-start' },
  line1: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  line1Home: { flexDirection: 'row-reverse' },
  line1Away: {},
  playerName: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    flexShrink: 1,
  },
  line2: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11.5,
    lineHeight: 16,
  },
  textRight: { textAlign: 'right' },
  textLeft: { textAlign: 'left' },
  minuteCircle: {
    width: 38,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  minuteText: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 11.5,
  },
  icon: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  card: {
    width: 11,
    height: 14,
    borderRadius: 2,
    flexShrink: 0,
  },
  subIconWrap: { width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  subArrow: {
    width: 10,
    height: 10,
    borderRightWidth: 2,
    borderTopWidth: 2,
    transform: [{ rotate: '45deg' }],
  },
  doubleCard: {
    flexDirection: "row",
    alignItems: "center",
  },
  yellowCard: {
    zIndex: 1,
  },
  redCard: {
    marginLeft: -7,
    marginTop: -4,
    zIndex: 10,
    elevation: 10,
  }
});
