import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { LeagueSummary } from '../../lib/api/types';
import { useTheme } from '../../lib/theme/useTheme';
import { formatStartDate } from '../../lib/utils/dates';

interface Props {
  summary: LeagueSummary;
  onPress: () => void;
}

export function LeagueCard({ summary, onPress }: Props) {
  const { colors } = useTheme();
  const { name, imagePath, isWomens, currentSeasonYear, seasonState, startingAt, leader, champion, liveCount } = summary;

  const hasLive = liveCount > 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.82}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: hasLive
            ? blendLiveBorder(colors.live, colors.border)
            : colors.border,
        },
      ]}
    >
      {/* Red left edge for live leagues */}
      {hasLive && (
        <View style={[styles.liveEdge, { backgroundColor: colors.live }]} />
      )}

      {/* League logo */}
      <View
        style={[
          styles.logo,
          { backgroundColor: colors.surfaceSunken, borderColor: colors.border },
        ]}
      >
        {imagePath ? (
          <Image source={{ uri: imagePath }} style={styles.logoImg} resizeMode="contain" />
        ) : (
          <View style={[styles.logoFallback, isWomens && styles.logoFallbackWomens]} />
        )}
        {isWomens && <View style={styles.womensTint} />}
      </View>

      {/* Info block */}
      <View style={styles.info}>
        <View style={styles.rowTop}>
          <Text style={[styles.leagueName, { color: colors.text }]} numberOfLines={1}>
            {name}
          </Text>
          {currentSeasonYear ? (
            <Text style={[styles.seasonYear, { color: colors.textMuted }]}>
              {currentSeasonYear}
            </Text>
          ) : null}
        </View>

        <View style={styles.rowBottom}>
          {seasonState === 'upcoming' && startingAt ? (
            <View style={styles.upcomingMeta}>
              <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
              <Text style={[styles.upcomingText, { color: colors.textSecondary }]}>
                Hefst {formatStartDate(startingAt)}
              </Text>
            </View>
          ) : seasonState === 'finished' && champion ? (
            <>
              <View style={styles.leader}>
                <TeamCrest imagePath={champion.imagePath} shortCode={champion.shortCode} gold />
                <Text style={[styles.leaderName, { color: colors.text }]} numberOfLines={1}>
                  {champion.name}
                </Text>
              </View>
              <View style={[styles.championBadge, { backgroundColor: colors.goldSoft }]}>
                <Ionicons name="trophy" size={9} color={colors.gold} />
                <Text style={[styles.championText, { color: colors.gold }]}>Meistari</Text>
              </View>
            </>
          ) : leader ? (
            <>
              <View style={styles.leader}>
                <TeamCrest imagePath={leader.imagePath} shortCode={leader.shortCode} />
                <Text style={[styles.leaderName, { color: colors.text }]} numberOfLines={1}>
                  {leader.name}
                </Text>
                <Text style={[styles.leaderPoints, { color: colors.textMuted }]}>
                  {leader.points} stig
                </Text>
              </View>
              {hasLive && (
                <View style={[styles.livePill, { backgroundColor: colors.live }]}>
                  <View style={styles.liveDot} />
                  <Text style={styles.livePillText}>{liveCount} LIVE</Text>
                </View>
              )}
            </>
          ) : null}
        </View>

        {seasonState === 'active' && (
          <Text style={[styles.statusLine, { color: colors.textMuted }]}>
            {hasLive ? `${liveCount} leikir í beinni` : 'Virk deild'}
          </Text>
        )}
        {seasonState === 'finished' && (
          <Text style={[styles.statusLine, { color: colors.textMuted }]}>
            Lokið · Sigurvegari {currentSeasonYear}
          </Text>
        )}
      </View>

      {/* Chevron */}
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

function TeamCrest({
  imagePath,
  shortCode,
  gold,
}: {
  imagePath: string;
  shortCode: string;
  gold?: boolean;
}) {
  const { colors } = useTheme();
  const [hasError, setHasError] = React.useState(false);

  return (
    <View
      style={[
        styles.crest,
        {
          backgroundColor: colors.surfaceElev,
          borderColor: gold ? colors.gold : colors.border,
          borderWidth: gold ? 1.5 : 1,
        },
      ]}
    >
      {!hasError && imagePath ? (
        <Image
          source={{ uri: imagePath }}
          style={styles.crestImg}
          onError={() => setHasError(true)}
        />
      ) : (
        <Text style={[styles.crestText, { color: colors.textMuted }]}>
          {shortCode.slice(0, 3)}
        </Text>
      )}
    </View>
  );
}

function blendLiveBorder(live: string, border: string): string {
  return live + '66'; // 40% opacity live color — approximation
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    paddingLeft: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  liveEdge: {
    position: 'absolute',
    left: 0,
    top: 14,
    bottom: 14,
    width: 3,
    borderRadius: 2,
  },
  followedStar: {
    position: 'absolute',
    top: 10,
    right: 30,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    flexShrink: 0,
  },
  logoImg: {
    width: '100%',
    height: '100%',
  },
  logoFallback: {
    position: 'absolute',
    inset: 4,
    borderRadius: 8,
    backgroundColor: '#02529c',
  },
  logoFallbackWomens: {
    backgroundColor: '#8c6fa8',
  },
  womensTint: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(232, 121, 159, 0.15)',
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
  },
  leagueName: {
    fontFamily: 'BricolageGrotesque_700Bold',
    fontSize: 16,
    letterSpacing: -0.25,
    lineHeight: 19,
    flex: 1,
  },
  seasonYear: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 11,
    flexShrink: 0,
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 22,
  },
  leader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
    minWidth: 0,
  },
  crest: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  crestImg: { width: 20, height: 20 },
  crestText: {
    fontFamily: 'BricolageGrotesque_800ExtraBold',
    fontSize: 7,
    letterSpacing: -0.3,
  },
  leaderName: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12.5,
    flex: 1,
  },
  leaderPoints: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 11,
    flexShrink: 0,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    flexShrink: 0,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#fff',
  },
  livePillText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 9.5,
    color: '#fff',
    letterSpacing: 0.4,
  },
  championBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    flexShrink: 0,
  },
  championText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 9.5,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  upcomingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  upcomingText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11.5,
  },
  statusLine: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11.5,
    letterSpacing: 0.1,
  },
});
