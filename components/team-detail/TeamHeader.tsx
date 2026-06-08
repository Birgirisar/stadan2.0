import React from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { getLocalTeamBadge } from '../../constants/teamBadges';
import { useTheme } from '../../lib/theme/useTheme';
import type { TeamInfo } from '../../lib/api/teamDetail';

interface Props {
  team: TeamInfo;
  leagueName: string | null;
  onLayout?: (height: number) => void;
}

export function TeamHeader({ team, leagueName, onLayout }: Props) {
  const { colors } = useTheme();
  const [imgError, setImgError] = React.useState(false);
  const localSource = getLocalTeamBadge(team.id);

  return (
    <View
      style={styles.container}
      onLayout={onLayout ? (e) => onLayout(e.nativeEvent.layout.height) : undefined}
    >
      {/* Large crest */}
      <View style={styles.crestWrap}>
        {localSource ? (
          <Image source={localSource} style={styles.crest} />
        ) : imgError || !team.image_path ? (
          <View style={[styles.crestFallback, { backgroundColor: colors.surfaceElev, borderColor: colors.border }]}>
            <Text style={[styles.crestFallbackText, { color: colors.textMuted }]}>
              {(team.short_code ?? team.name).slice(0, 3).toUpperCase()}
            </Text>
          </View>
        ) : (
          <Image
            source={{ uri: team.image_path }}
            style={styles.crest}
            onError={() => setImgError(true)}
          />
        )}
      </View>

      {/* Team name */}
      <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={2}>
        {team.name}
      </Text>

      {/* Meta row */}
      <View style={styles.metaRow}>
        {leagueName && (
          <MetaChip
            label={leagueName}
            colors={colors}
          />
        )}
        {team.founded ? (
          <MetaChip label={`Stofn. ${team.founded}`} colors={colors} />
        ) : null}
        {team.country?.name ? (
          <MetaChip label={team.country.name} colors={colors} />
        ) : null}
      </View>
    </View>
  );
}

function MetaChip({ label, colors }: { label: string; colors: any }) {
  return (
    <View style={[styles.chip, { backgroundColor: colors.surfaceElev, borderColor: colors.border }]}>
      <Text style={[styles.chipText, { color: colors.textSecondary }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 20,
    gap: 12,
  },
  crestWrap: {
    width: 88,
    height: 88,
  },
  crest: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  crestFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crestFallbackText: {
    fontFamily: 'BricolageGrotesque_800ExtraBold',
    fontSize: 26,
    letterSpacing: -0.5,
  },
  teamName: {
    fontFamily: 'BricolageGrotesque_800ExtraBold',
    fontSize: 28,
    letterSpacing: -0.5,
    textAlign: 'center',
    lineHeight: 32,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11.5,
  },
});
