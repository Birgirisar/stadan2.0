import React, { memo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { LineupEntry, FixtureEvent } from '../../../lib/api/types';
import { getPlayerStatusIcons, entryFullName, isValidPlayerImage } from '../../../lib/utils/lineup';

interface Props {
  entry: LineupEntry;
  events: FixtureEvent[];
  isPredicted: boolean;
  onPress: (entry: LineupEntry) => void;
}

const AVATAR_SIZE = 48;   // outer ring diameter
const RING_W = 2;         // border thickness
const INNER = AVATAR_SIZE - 2 * RING_W; // clip circle diameter (44)
const ICON_SIZE = 14;
const CARD_W = 9;
const CARD_H = 12;

export const PlayerMarker = memo(function PlayerMarker({ entry, events, isPredicted, onPress }: Props) {
  const [imgError, setImgError] = useState(false);
  const effectivePlayerId = entry.player_id || entry.player?.id || 0;
  const playerName = entry.player_name ?? entry.player?.name ?? null;
  const icons = isPredicted ? [] : getPlayerStatusIcons(effectivePlayerId, playerName, events);
  const familyName = entryFullName(entry);
  const num = entry.jersey_number;
  const imageUri = entry.player?.image_path;
  const showImage = isValidPlayerImage(imageUri) && !imgError;

  const goals = icons.filter(i => i === 'goal' || i === 'own-goal') as Array<'goal' | 'own-goal'>;
  const assists = icons.filter(i => i === 'assist');
  const cards = icons.filter(i => i === 'yellow' || i === 'red') as Array<'yellow' | 'red'>;
  const hasSubOff = icons.includes('sub-off');

  return (
    <Pressable style={styles.container} onPress={() => onPress(entry)}>
      {/*
       * avatarArea is the absolute-positioning anchor for all badge overlays.
       * avatarRing draws the visible border without overflow:hidden so it doesn't
       * clip the image. avatarClip is the inner circle that actually clips the image,
       * sized to fit exactly inside the ring — this keeps the image perfectly centred.
       */}
      <View style={styles.avatarArea}>
        <View style={styles.avatarRing}>
          <View style={styles.avatarClip}>
            {showImage ? (
              <Image
                source={{ uri: imageUri! }}
                style={styles.avatarImg}
                resizeMode="cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <>
                <View style={styles.silhouetteHead} />
                <View style={styles.silhouetteBody} />
              </>
            )}
          </View>
        </View>

        {/* Captain badge — bottom-centre */}
        {entry.captain && (
          <View style={styles.captainBadge}>
            <Text style={styles.captainText}>C</Text>
          </View>
        )}

        {/* Sub-off — top-left, red circle with downward triangle */}
        {hasSubOff && (
          <View style={styles.subOffBadge}>
            <View style={styles.subOffTriangle} />
          </View>
        )}

        {/* Cards — left edge, vertically centred */}
        {cards.length > 0 && (
          <View style={styles.cardStack}>
            {cards.map((card, i) => (
              <View
                key={i}
                style={[styles.cardIcon, { backgroundColor: card === 'yellow' ? '#f5c518' : '#d63031' }]}
              />
            ))}
          </View>
        )}

        {/* Assist — bottom-left */}
        {assists.length > 0 && (
          <View style={styles.assistIcon}>
            <MaterialCommunityIcons name="shoe-cleat" size={17} color="#111" />
          </View>
        )}

        {/* Goals — bottom-right, overlapping row */}
        {goals.length > 0 && (
          <View style={styles.goalGroup}>
            {goals.map((type, i) => (
              <View
                key={i}
                style={[styles.goalIcon, i > 0 && styles.goalOverlap, type === 'own-goal' && styles.goalIconOwnGoal]}
              >
                <Ionicons name="football-outline" size={15} color={type === 'own-goal' ? '#fff' : '#111'} />
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.labelRow}>
        {num != null && <Text style={styles.numText}>{num}</Text>}
        {!!familyName && (
          <Text style={styles.nameText}>
            {familyName}
          </Text>
        )}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 5,
    minWidth: 64,
    maxWidth: 84,
  },
  avatarArea: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    position: 'relative',
  },
  // Border ring — no overflow:hidden so it doesn't clip the image
  avatarRing: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: RING_W,
    borderColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Inner clip circle — perfectly centred inside the ring
  avatarClip: {
    width: INNER,
    height: INNER,
    borderRadius: INNER / 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  avatarImg: {
    width: INNER,
    height: INNER,
  },
  silhouetteHead: {
    position: 'absolute',
    top: '27%' as any,
    alignSelf: 'center',
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  silhouetteBody: {
    position: 'absolute',
    bottom: -4,
    alignSelf: 'center',
    width: INNER * 0.72,
    height: INNER * 0.48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  captainBadge: {
    position: 'absolute',
    bottom: -2,
    alignSelf: 'center',
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    zIndex: 4,
  },
  captainText: {
    fontFamily: 'BricolageGrotesque_800ExtraBold',
    fontSize: 8,
    color: '#fff',
    lineHeight: 10,
  },
  subOffBadge: {
    position: 'absolute',
    top: -5,
    left: -6,
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    backgroundColor: '#d63031',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 1,
    elevation: 3,
  },
  subOffTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 3.5,
    borderRightWidth: 3.5,
    borderTopWidth: 5,
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#fff',
  },
  cardStack: {
    position: 'absolute',
    top: (AVATAR_SIZE - CARD_H) / 2,
    left: -5,
    flexDirection: 'column',
    gap: 3,
    zIndex: 5,
  },
  cardIcon: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 1,
    elevation: 3,
  },
  assistIcon: {
    position: 'absolute',
    bottom: -(ICON_SIZE / 2 - 1),
    left: -(ICON_SIZE / 2 - 1),
    width: ICON_SIZE + 4,
    height: ICON_SIZE + 4,
    borderRadius: (ICON_SIZE + 4) / 2,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 1,
    elevation: 3,
  },
  goalIcon: {
    width: ICON_SIZE + 4,
    height: ICON_SIZE + 4,
    borderRadius: (ICON_SIZE + 4) / 2,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 1,
    elevation: 3,
  },
  goalIconOwnGoal: {
    backgroundColor: '#d63031',
  },
  goalGroup: {
    position: 'absolute',
    bottom: -(ICON_SIZE / 2 - 1),
    right: -(ICON_SIZE / 2 - 1),
    flexDirection: 'row',
    zIndex: 5,
  },
  goalOverlap: {
    marginLeft: -4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    maxWidth: 84,
  },
  numText: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: -0.2,
  },
  nameText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    color: '#fff',
    flexShrink: 1,
  },
});
