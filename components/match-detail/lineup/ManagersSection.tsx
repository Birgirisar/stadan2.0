import React, { memo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import type { Coach } from '../../../lib/api/types';
import { isValidPlayerImage } from '../../../lib/utils/lineup';
import { useTheme } from '../../../lib/theme/useTheme';

interface Props {
  homeCoach: Coach | null;
  awayCoach: Coach | null;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamShortCode: string;
  awayTeamShortCode: string;
  homeImagePath: string;
  awayImagePath: string;
}

const AVATAR_SIZE = 36;
const RING_W = 1;
const INNER = AVATAR_SIZE - 2 * RING_W; // 34

export function ManagersSection({
  homeCoach,
  awayCoach,
  homeTeamName,
  awayTeamName,
  homeImagePath,
  awayImagePath,
}: Props) {
  const { colors } = useTheme();

  if (!homeCoach && !awayCoach) return null;

  const coachName = (coach: Coach | null) => {
    if (!coach) return '—';
    if (coach.firstname && coach.lastname) return `${coach.firstname} ${coach.lastname}`;
    return coach.display_name ?? coach.common_name ?? coach.name ?? '—';
  };

  return (
    <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Team header row */}
      <View style={[styles.teamHeaderRow, { borderColor: colors.border }]}>
        <View style={styles.teamHeaderCell}>
          {!!homeImagePath && (
            <Image source={{ uri: homeImagePath }} style={styles.teamCrest} resizeMode="contain" />
          )}
          <Text style={[styles.teamName, { color: colors.textMuted }]} numberOfLines={1}>
            {homeTeamName}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.teamHeaderCell}>
          {!!awayImagePath && (
            <Image source={{ uri: awayImagePath }} style={styles.teamCrest} resizeMode="contain" />
          )}
          <Text style={[styles.teamName, { color: colors.textMuted }]} numberOfLines={1}>
            {awayTeamName}
          </Text>
        </View>
      </View>

      <View style={styles.grid}>
        <CoachCol
          coach={homeCoach}
          coachName={coachName(homeCoach)}
          colors={colors}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <CoachCol
          coach={awayCoach}
          coachName={coachName(awayCoach)}
          colors={colors}
        />
      </View>
    </View>
  );
}

const CoachCol = memo(function CoachCol({
  coach,
  coachName,
  colors,
}: {
  coach: Coach | null;
  coachName: string;
  colors: ReturnType<typeof import('../../../lib/theme/useTheme').useTheme>['colors'];
}) {
  const [imgError, setImgError] = useState(false);
  const imageUri = coach?.image_path;
  const showImage = isValidPlayerImage(imageUri) && !imgError;

  return (
    <View style={styles.col}>
      {/* Ring/clip separation keeps the photo perfectly centred in the ring */}
      <View style={[styles.avatarRing, { borderColor: colors.border }]}>
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
              <View style={styles.silhouetteHead} />
              <View style={styles.silhouetteBody} />
            </>
          )}
        </View>
      </View>

      <View style={styles.meta}>
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Þjálfari</Text>
        </View>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {coachName}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 14,
    marginTop: 14,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  teamHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  teamHeaderCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 0,
  },
  teamCrest: {
    width: 16,
    height: 16,
    flexShrink: 0,
  },
  teamName: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    flexShrink: 1,
  },
  grid: {
    flexDirection: 'row',
  },
  divider: {
    width: 1,
  },
  col: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    minWidth: 0,
  },
  avatarRing: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: RING_W,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
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
  silhouetteHead: {
    position: 'absolute',
    top: '28%' as any,
    alignSelf: 'center',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(100,110,120,0.25)',
  },
  silhouetteBody: {
    position: 'absolute',
    bottom: -3,
    alignSelf: 'center',
    width: INNER * 0.75,
    height: INNER * 0.5,
    borderRadius: 10,
    backgroundColor: 'rgba(100,110,120,0.15)',
  },
  meta: {
    flex: 1,
    minWidth: 0,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 1,
  },
  label: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 9.5,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  name: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12.5,
    flexShrink: 1,
  },
});
