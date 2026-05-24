import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { LineupEntry } from '../../../lib/api/types';
import {
  getDetailValue,
  getRatingColor,
  isValidPlayerImage,
} from '../../../lib/utils/lineup';
import { useTheme } from '../../../lib/theme/useTheme';

interface Props {
  entry: LineupEntry | null;
  teamName: string;
  teamColor: string;
  visible: boolean;
  onClose: () => void;
}

export function PlayerPopup({ entry, teamName, teamColor, visible, onClose }: Props) {
  const { colors } = useTheme();
  const translateY = useRef(new Animated.Value(600)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  function handleClose() {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 600,
        duration: 220,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  }

  useEffect(() => { setImgError(false); }, [entry?.player_id]);

  if (!entry) return null;

  const player = entry.player;
  const imageUri = player?.image_path;
  const showImage = isValidPlayerImage(imageUri) && !imgError;
  const details = entry.details ?? [];
  const hasStats = details.length > 0;
  const rating = entry.rating;
  const ratingColor = getRatingColor(rating, colors);

  const fullName = player
    ? [player.firstname, player.lastname].filter(Boolean).join(' ') ||
      player.display_name ||
      player.common_name ||
      player.name ||
      ''
    : entry.player_name ?? '';

  const position = entry.position ?? '';
  const posLine = [teamName, position, entry.jersey_number ? `#${entry.jersey_number}` : null]
    .filter(Boolean)
    .join(' · ');

  const stats = [
    { label: 'Mörk', value: getDetailValue(details, 'goals') },
    { label: 'Stoðsendingar', value: getDetailValue(details, 'assists') },
    { label: 'Mínútur', value: getDetailValue(details, 'minutes_played') },
    { label: 'Skot', value: getDetailValue(details, 'shots_total') },
    { label: 'Sending %', value: getDetailValue(details, 'passes_accurate_percentage') },
    { label: 'Spjöld', value: getDetailValue(details, 'yellowcards') },
  ];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      {/* Backdrop tap-to-close, sheet nested inside so its touches don't propagate to backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose}>
          <Animated.View
            style={[
              styles.sheet,
              { backgroundColor: colors.surface, transform: [{ translateY }] },
            ]}
            onStartShouldSetResponder={() => true}
          >
        {/* Grabber */}
        <Pressable onPress={handleClose} style={styles.grabberArea}>
          <View style={[styles.grabber, { backgroundColor: colors.borderStrong }]} />
        </Pressable>

        {/* Header */}
        <View style={[styles.header, { borderColor: colors.border }]}>
          {/* Avatar */}
          <View style={styles.jerseyRingOuter}>
            <View style={[styles.jerseyRing, { backgroundColor: teamColor }]}>
              <View style={styles.jerseySep}>
                <View style={[styles.jerseyInner, { backgroundColor: colors.surfaceSunken }]}>
                  {showImage ? (
                    <Image
                      source={{ uri: imageUri! }}
                      style={styles.jerseyImg}
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
            </View>
          </View>

          <View style={styles.nameBlock}>
            <Text style={[styles.playerName, { color: colors.text }]} numberOfLines={1}>
              {fullName}
            </Text>
            <Text style={[styles.playerPos, { color: colors.textMuted }]} numberOfLines={1}>
              {posLine}
            </Text>
          </View>

          {rating != null && (
            <View style={[styles.ratingPill, { backgroundColor: ratingColor }]}>
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
            </View>
          )}
        </View>

        {/* Stats grid */}
        {hasStats && (
          <View style={styles.statsGrid}>
            {stats.map(({ label, value }) => (
              <View key={label} style={styles.statCell}>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
                <Text
                  style={[
                    styles.statValue,
                    { color: value != null && value !== 0 ? colors.text : colors.textMuted },
                  ]}
                >
                  {value ?? '—'}
                </Text>
              </View>
            ))}
          </View>
        )}
          </Animated.View>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const JERSEY_SIZE = 44;

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 20,
  },
  grabberArea: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 8,
  },
  grabber: {
    width: 38,
    height: 4,
    borderRadius: 999,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  jerseyRingOuter: {},
  jerseyRing: {
    borderRadius: (JERSEY_SIZE + 7) / 2,
    padding: 2,
  },
  jerseySep: {
    borderRadius: (JERSEY_SIZE + 3) / 2,
    padding: 1.5,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  jerseyInner: {
    width: JERSEY_SIZE,
    height: JERSEY_SIZE,
    borderRadius: JERSEY_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  jerseyImg: {
    width: JERSEY_SIZE,
    height: JERSEY_SIZE,
  },
  silHead: {
    position: 'absolute',
    top: '28%' as any,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(100,110,120,0.25)',
  },
  silBody: {
    position: 'absolute',
    bottom: -4,
    width: JERSEY_SIZE * 0.75,
    height: JERSEY_SIZE * 0.5,
    borderRadius: 16,
    backgroundColor: 'rgba(100,110,120,0.15)',
  },
  nameBlock: {
    flex: 1,
    minWidth: 0,
  },
  playerName: {
    fontFamily: 'BricolageGrotesque_800ExtraBold',
    fontSize: 18,
    letterSpacing: -0.25,
    lineHeight: 22,
    marginBottom: 2,
  },
  playerPos: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11.5,
  },
  ratingPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    flexShrink: 0,
  },
  ratingText: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 17,
    color: '#fff',
    letterSpacing: -0.2,
  },
  statsGrid: {
    paddingHorizontal: 20,
    paddingTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  statCell: {
    width: '30%' as any,
    gap: 2,
  },
  statLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statValue: {
    fontFamily: 'BricolageGrotesque_800ExtraBold',
    fontSize: 20,
    letterSpacing: -0.3,
    lineHeight: 22,
  },
});
