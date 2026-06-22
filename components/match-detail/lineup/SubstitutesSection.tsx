import React, { memo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { LineupEntry, FixtureEvent } from '../../../lib/api/types';
import { getSubOnInfo, getPlayerStatusIcons, isValidPlayerImage, type StatusIconType } from '../../../lib/utils/lineup';
import { useTheme } from '../../../lib/theme/useTheme';

interface Props {
  homeSubs: LineupEntry[];
  awaySubs: LineupEntry[];
  events: FixtureEvent[];
  isPredicted: boolean;
  onPlayerPress: (entry: LineupEntry) => void;
}

const AVATAR = 36;
const RING_W = 1.5;
const INNER = AVATAR - 2 * RING_W;

export function SubstitutesSection({
  homeSubs,
  awaySubs,
  events,
  isPredicted,
  onPlayerPress,
}: Props) {
  const { colors } = useTheme();

  if (!homeSubs.length && !awaySubs.length) return null;

  const rowCount = Math.max(homeSubs.length, awaySubs.length);

  return (
    <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.header, { borderColor: colors.border }]}>
        <Text style={[styles.headerText, { color: colors.textSecondary }]}>Varamenn</Text>
      </View>

      {/* One row per player position */}
      {Array.from({ length: rowCount }, (_, i) => (
        <View key={i} style={[styles.playerRow, { borderColor: colors.border }]}>
          <SubRow
            entry={homeSubs[i] ?? null}
            events={events}
            isPredicted={isPredicted}
            onPress={onPlayerPress}
            colors={colors}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SubRow
            entry={awaySubs[i] ?? null}
            events={events}
            isPredicted={isPredicted}
            onPress={onPlayerPress}
            colors={colors}
          />
        </View>
      ))}
    </View>
  );
}

const SubRow = memo(function SubRow({
  entry,
  events,
  isPredicted,
  onPress,
  colors,
}: {
  entry: LineupEntry | null;
  events: FixtureEvent[];
  isPredicted: boolean;
  onPress: (entry: LineupEntry) => void;
  colors: ReturnType<typeof import('../../../lib/theme/useTheme').useTheme>['colors'];
}) {
  const [imgError, setImgError] = useState(false);

  if (!entry) return <View style={styles.cell} />;

  const effectivePlayerId = entry.player_id || entry.player?.id || 0;
  const playerName = entry.player_name ?? entry.player?.name ?? null;
  const subOn = isPredicted ? null : getSubOnInfo(effectivePlayerId, playerName, events);
  const allIcons = isPredicted ? [] : getPlayerStatusIcons(effectivePlayerId, playerName, events);
  const cardIcons = allIcons.filter(i => i === 'yellow' || i === 'red') as Array<'yellow' | 'red'>;
  const goals = allIcons.filter(i => i === 'goal' || i === 'own-goal') as Array<'goal' | 'own-goal'>;
  const assists = allIcons.filter(i => i === 'assist');
  const imageUri = entry.player?.image_path;
  const showImage = isValidPlayerImage(imageUri) && !imgError;
  const num = entry.jersey_number;

  const fullName =
    entry.player
      ? [entry.player.firstname, entry.player.lastname].filter(Boolean).join(' ') ||
        entry.player.display_name ||
        entry.player.common_name ||
        entry.player.name ||
        ''
      : entry.player_name ?? '';

  return (
    <Pressable
      style={({ pressed }) => [styles.cell, pressed && { backgroundColor: colors.surfaceSunken }]}
      onPress={() => onPress(entry)}
    >
      {/* Avatar centered */}
      <View style={styles.avatarArea}>
        <View style={[styles.avatarRing, { borderColor: 'rgba(128,128,128,0.3)' }]}>
          <View style={[styles.avatarClip, { backgroundColor: colors.surfaceSunken }]}>
            {showImage ? (
              <Image
                source={{ uri: imageUri! }}
                style={styles.avatarImg}
                resizeMode="cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <>
                <View style={styles.silHead} />
                <View style={styles.silBody} />
              </>
            )}
          </View>
        </View>

        {/* Sub-on badge */}
        {subOn && (
          <View style={styles.subOnBadge}>
            <View style={styles.subOnTriangle} />
          </View>
        )}

        {/* Card badges */}
        {cardIcons.length > 0 && (
          <View style={styles.cardStack}>
            {cardIcons.map((icon, i) => (
              <CardBadge key={i} type={icon} />
            ))}
          </View>
        )}

        {/* Assist badge */}
        {assists.length > 0 && (
          <View style={styles.assistIcon}>
            <MaterialCommunityIcons name="shoe-cleat" size={13} color="#111" />
          </View>
        )}

        {/* Goal badges */}
        {goals.length > 0 && (
          <View style={styles.goalGroup}>
            {goals.map((type, i) => (
              <View
                key={i}
                style={[styles.goalIcon, i > 0 && styles.goalOverlap, type === 'own-goal' && styles.goalIconOwnGoal]}
              >
                <Ionicons name="football-outline" size={11} color={type === 'own-goal' ? '#fff' : '#111'} />
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Number + full name below avatar */}
      <View style={styles.nameLine}>
        {num != null && (
          <Text style={[styles.num, { color: colors.textMuted }]}>{num}</Text>
        )}
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {fullName}
        </Text>
      </View>

      {/* Sub-on minute */}
      {subOn && (
        <Text style={styles.minute}>{subOn.minute}'</Text>
      )}
    </Pressable>
  );
});

function CardBadge({ type }: { type: StatusIconType }) {
  if (type === 'yellow') return <View style={[styles.cardRect, { backgroundColor: '#f5c518' }]} />;
  if (type === 'red') return <View style={[styles.cardRect, { backgroundColor: '#d63031' }]} />;
  return null;
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 14,
    marginTop: 14,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerText: {
    fontFamily: 'BricolageGrotesque_700Bold',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  divider: {
    width: 1,
  },
  playerRow: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cell: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 10,
    minWidth: 0,
  },
  avatarArea: {
    width: AVATAR,
    height: AVATAR,
    position: 'relative',
    flexShrink: 0,
  },
  avatarRing: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    borderWidth: RING_W,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarClip: {
    width: INNER,
    height: INNER,
    borderRadius: INNER / 2,
    overflow: 'hidden',
  },
  avatarImg: {
    width: INNER,
    height: INNER,
  },
  silHead: {
    position: 'absolute',
    top: '25%' as any,
    alignSelf: 'center',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(128,128,128,0.35)',
  },
  silBody: {
    position: 'absolute',
    bottom: -3,
    alignSelf: 'center',
    width: INNER * 0.72,
    height: INNER * 0.5,
    borderRadius: 10,
    backgroundColor: 'rgba(128,128,128,0.25)',
  },
  subOnBadge: {
    position: 'absolute',
    top: -3,
    left: -3,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#1b8c3f',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 1,
    elevation: 2,
  },
  subOnTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 2.5,
    borderRightWidth: 2.5,
    borderBottomWidth: 4,
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#fff',
  },
  cardStack: {
    position: 'absolute',
    top: -3,
    right: -3,
    flexDirection: 'column',
    gap: 2,
    zIndex: 3,
  },
  cardRect: {
    width: 6,
    height: 9,
    borderRadius: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 1,
    elevation: 2,
  },
  assistIcon: {
    position: 'absolute',
    bottom: -3,
    left: -3,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 1,
    elevation: 2,
  },
  goalGroup: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    flexDirection: 'row',
    zIndex: 3,
  },
  goalIcon: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 1,
    elevation: 2,
  },
  goalIconOwnGoal: {
    backgroundColor: '#d63031',
  },
  goalOverlap: {
    marginLeft: -4,
  },
  nameLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    paddingHorizontal: 4,
  },
  num: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 10,
    letterSpacing: -0.2,
    flexShrink: 0,
  },
  name: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12.5,
    flexShrink: 1,
  },
  minute: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 10,
    color: '#1b8c3f',
  },
});
