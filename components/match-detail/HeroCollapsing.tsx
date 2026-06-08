import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Animated, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { DetailedFixture } from '../../lib/api/types';
import { useTheme } from '../../lib/theme/useTheme';
import { getScore } from '../../lib/utils/score';
import { getMatchState, getLiveMinute } from '../../lib/utils/state';
import { formatKickoffTime, formatMatchDate } from '../../lib/utils/dates';
import { TeamBadge } from '../fixtures/TeamBadge';
import { ScorersList } from './ScorersList';
import { SubTabs, type SubTabId } from './SubTabs';
import { getAvailableSubTabs } from '../../lib/utils/matchSubTabs';
import { EVENT_TYPE } from '../../lib/utils/events';
import { LEAGUES } from '@/constants/leagues';

export const HERO_SUBTABS_H = 46;

function RedCardStack({ count, size = 'large' }: { count: number; size?: 'large' | 'small' }) {
  if (count === 0) return null;
  const w = size === 'large' ? 8 : 6;
  const h = size === 'large' ? 11 : 9;
  const r = size === 'large' ? 1.5 : 1;
  const overlap = size === 'large' ? -3 : -2;
  return (
    <View style={{ flexDirection: 'row' }}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={{
            width: w,
            height: h,
            borderRadius: r,
            backgroundColor: '#d63031',
            marginLeft: i > 0 ? overlap : 0,
          }}
        />
      ))}
    </View>
  );
}
const COMPACT_CONTENT_H = 52;

interface Props {
  fixture: DetailedFixture;
  scrollY: Animated.Value;
  collapseRange: number;
  insetTop: number;
  heroFull: number;
  onBack: () => void;
  onFullHeightMeasured: (height: number) => void;
  activeTab: SubTabId;
  onTabChange: (tab: SubTabId) => void;
}

export function HeroCollapsing({
  fixture,
  scrollY,
  collapseRange,
  insetTop,
  heroFull,
  onBack,
  onFullHeightMeasured,
  activeTab,
  onTabChange,
}: Props) {
  const { colors, theme } = useTheme();
  const router = useRouter();

  const goToTeam = (teamId: number | undefined) => {
    if (!teamId) return;
    router.push(`/team/${teamId}` as any);
  };

  const home = fixture.participants?.find((p) => p.meta.location === 'home');
  const away = fixture.participants?.find((p) => p.meta.location === 'away');
  const score = getScore(fixture);
  const hasScorers = (score.home ?? 0) + (score.away ?? 0) > 0;
  const stateResult = getMatchState(fixture.state);
  const isPending = stateResult.type === 'pending';
  const liveMinute = getLiveMinute(fixture.periods);

  const homeRedCards = (fixture.events ?? []).filter(
    (e) => (e.type_id === EVENT_TYPE.RED_CARD || e.type_id === EVENT_TYPE.YELLOW_RED) &&
      e.participant_id === home?.id,
  ).length;
  const awayRedCards = (fixture.events ?? []).filter(
    (e) => (e.type_id === EVENT_TYPE.RED_CARD || e.type_id === EVENT_TYPE.YELLOW_RED) &&
      e.participant_id === away?.id,
  ).length;

  const leagueName = fixture.league?.name ?? '';
  const leagueInfo = LEAGUES[fixture.league_id as keyof typeof LEAGUES];
  const displayLeagueName = leagueInfo?.displayName ?? leagueName;
  const roundName = fixture.round?.name;
  const leaguePill = [displayLeagueName, roundName ? `Umferð ${roundName}` : ''].filter(Boolean).join(' · ');

  const COMPACT_H = insetTop + COMPACT_CONTENT_H + HERO_SUBTABS_H;

  // ── Hero height collapses to compact bar + subtabs ──────────────
  const heroHeight = scrollY.interpolate({
    inputRange: [0, collapseRange],
    outputRange: [heroFull, COMPACT_H],
    extrapolate: 'clamp',
  });

  // ── Fixed top area: league pill fades out, compact center fades in ──
  const leaguePillOpacity = scrollY.interpolate({
    inputRange: [0, collapseRange * 0.4],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const compactCenterOpacity = scrollY.interpolate({
    inputRange: [collapseRange * 0.6, collapseRange * 0.92],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // ── Rich content: staggered element fades ───────────────────────
  const richTranslateY = scrollY.interpolate({
    inputRange: [0, collapseRange],
    outputRange: [0, -24],
    extrapolate: 'clamp',
  });

  // Scorers disappear first
  const scorersOpacity = scrollY.interpolate({
    inputRange: [0, collapseRange * 0.32],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Team names disappear second
  const namesOpacity = scrollY.interpolate({
    inputRange: [0, collapseRange * 0.5],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Crests + score shrink and disappear last in the rich layer
  const scoreOpacity = scrollY.interpolate({
    inputRange: [collapseRange * 0.3, collapseRange * 0.65],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const scoreScale = scrollY.interpolate({
    inputRange: [0, collapseRange * 0.65],
    outputRange: [1, 0.75],
    extrapolate: 'clamp',
  });

  // ── Status label ────────────────────────────────────────────────
  const statusLabel =
    stateResult.type === 'finished' ? 'Leik lokið' :
    stateResult.type === 'halftime' ? 'Hálfleikur' :
    stateResult.type === 'live' ? (liveMinute ?? fixture.state?.short_name ?? 'LIVE') :
    stateResult.type === 'cancelled'
      ? (fixture.state?.state === 'POSTP' ? 'Frestað' : 'Aflýst')
      : '';

  const handleRichLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0) onFullHeightMeasured(insetTop + COMPACT_CONTENT_H + h + HERO_SUBTABS_H);
  };

  const gradStart = theme === 'dark' ? '#0b120f' : '#ecf5f0';
  const gradEnd = colors.bg;

  // Vertically center the 44px button within the 52px compact content row
  const btnTop = insetTop + (COMPACT_CONTENT_H - 44) / 2;

  return (
    <Animated.View style={[styles.hero, { height: heroHeight, backgroundColor: colors.surface }]}>
      {/* Background gradient — must stay first child so it renders behind everything */}
      <LinearGradient
        colors={[gradStart, gradEnd]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        pointerEvents="none"
      />

      {/* League pill — centered between the fixed buttons, fades out */}
      <Animated.View
        style={[styles.centerOverlay, { top: insetTop, height: COMPACT_CONTENT_H, opacity: leaguePillOpacity }]}
        pointerEvents="none"
      >
        <View style={[styles.leaguePill, { backgroundColor: colors.surface + '80', borderColor: colors.border }]}>
          <View style={styles.flagCircle} />
          <Text style={[styles.leaguePillText, { color: colors.textSecondary }]} numberOfLines={1}>
            {leaguePill}
          </Text>
        </View>
      </Animated.View>

      {/* Compact center — badges + score — fades in when collapsed */}
      <Animated.View
        style={[styles.centerOverlay, { top: insetTop, height: COMPACT_CONTENT_H, opacity: compactCenterOpacity }]}
        pointerEvents="none"
      >
        <View style={styles.compactCenter}>
          <TeamBadge imageUrl={home?.image_path ?? ''} shortCode={home?.short_code ?? ''} size={26} teamId={home?.id} />
          {isPending ? (
            <Text style={[styles.compactScore, { color: colors.text }]}>
              {formatKickoffTime(fixture.starting_at)}
            </Text>
          ) : (
            <Text style={[styles.compactScore, { color: colors.text }]}>
              {score.home ?? '-'}
              <Text style={{ color: colors.textMuted }}>{'–'}</Text>
              {score.away ?? '-'}
            </Text>
          )}
          <TeamBadge imageUrl={away?.image_path ?? ''} shortCode={away?.short_code ?? ''} size={26} teamId={away?.id} />
        </View>
      </Animated.View>

      {/* Rich content — shifts up on scroll, elements fade staggered */}
      <Animated.View
        onLayout={handleRichLayout}
        style={[
          styles.richContent,
          { marginTop: insetTop + COMPACT_CONTENT_H, transform: [{ translateY: richTranslateY }] },
        ]}
      >
        {/* Row 1: crests + score digits */}
        <Animated.View style={[styles.scoreRow1, { opacity: scoreOpacity }]}>
          <Pressable style={styles.teamCrestCell} onPress={() => goToTeam(home?.id)} hitSlop={8}>
            <TeamBadge imageUrl={home?.image_path ?? ''} shortCode={home?.short_code ?? ''} size={48} teamId={home?.id} />
          </Pressable>

          {/* Fixed-width columns keep the center cell perfectly centred regardless of cards */}
          <View style={styles.cardColHome}>
            <RedCardStack count={homeRedCards} />
          </View>

          <Animated.View style={[styles.scoreCenterCell, { transform: [{ scale: scoreScale }] }]}>
            {isPending ? (
              <Text style={[styles.scoreValue, { color: colors.text }]}>
                {formatKickoffTime(fixture.starting_at)}
              </Text>
            ) : (
              <View style={styles.scoreDigitRow}>
                <Text style={[styles.scoreDigit, { color: colors.text }]}>{score.home ?? '-'}</Text>
                <Text style={[styles.scoreSep, { color: colors.textMuted }]}>–</Text>
                <Text style={[styles.scoreDigit, { color: colors.text }]}>{score.away ?? '-'}</Text>
              </View>
            )}
          </Animated.View>

          <View style={styles.cardColAway}>
            <RedCardStack count={awayRedCards} />
          </View>

          <Pressable style={styles.teamCrestCell} onPress={() => goToTeam(away?.id)} hitSlop={8}>
            <TeamBadge imageUrl={away?.image_path ?? ''} shortCode={away?.short_code ?? ''} size={48} teamId={away?.id} />
          </Pressable>
        </Animated.View>

        {/* Row 2: team names + status pill */}
        <Animated.View style={[styles.scoreRow2, { opacity: namesOpacity }]}>
          <Pressable style={styles.teamNameCell} onPress={() => goToTeam(home?.id)}>
            <Text style={[styles.teamLabel, { color: colors.text }]} numberOfLines={2}>
              {home?.name ?? ''}
            </Text>
          </Pressable>
          <View style={styles.cardColHome} />
          <View style={styles.statusCell}>
            {isPending && fixture.starting_at ? (
              <Text style={[styles.pendingDate, { color: colors.textMuted }]}>
                {formatMatchDate(fixture.starting_at)}
              </Text>
            ) : (
              !!statusLabel && (
                <View
                  style={[
                    styles.statusPill,
                    stateResult.type === 'live'
                      ? { backgroundColor: colors.live }
                      : { backgroundColor: colors.surfaceSunken },
                  ]}
                >
                  {stateResult.type === 'live' && <View style={styles.liveDot} />}
                  <Text
                    style={[
                      styles.statusText,
                      { color: stateResult.type === 'live' ? '#fff' : colors.textMuted },
                    ]}
                  >
                    {statusLabel}
                  </Text>
                </View>
              )
            )}
          </View>
          <View style={styles.cardColAway} />
          <Pressable style={styles.teamNameCell} onPress={() => goToTeam(away?.id)}>
            <Text style={[styles.teamLabel, { color: colors.text }]} numberOfLines={2}>
              {away?.name ?? ''}
            </Text>
          </Pressable>
        </Animated.View>

        {/* Row 3: scorers per team */}
        {!isPending && fixture.events && hasScorers && (
          <Animated.View style={[styles.scoreRow3, { opacity: scorersOpacity }]}>
            <View style={styles.scorersCell}>
              {home && <ScorersList events={fixture.events} teamId={home.id} />}
            </View>
            <View style={styles.cardColHome} />
            <View style={styles.scorersSpacer}>
              <Ionicons name="football" size={14} color={colors.textMuted} />
            </View>
            <View style={styles.cardColAway} />
            <View style={styles.scorersCell}>
              {away && <ScorersList events={fixture.events} teamId={away.id} />}
            </View>
          </Animated.View>
        )}

        <View style={{ height: 14 }} />
      </Animated.View>

      {/* SubTabs — pinned to the bottom of the hero at all scroll positions */}
      <View style={styles.subTabsAnchor}>
        <SubTabs
          activeTab={activeTab}
          onTabChange={onTabChange}
          tabs={getAvailableSubTabs(fixture)}
        />
      </View>

      {/* Fixed back button — always anchored top-left */}
      <Pressable
        onPress={onBack}
        style={[
          styles.roundBtn,
          { position: 'absolute', top: btnTop, left: 14, backgroundColor: colors.surface + '80', borderColor: colors.border },
        ]}
        hitSlop={8}
      >
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </Pressable>

      {/* Fixed share button — always anchored top-right */}
      <Pressable
        style={[
          styles.roundBtn,
          { position: 'absolute', top: btnTop, right: 14, backgroundColor: colors.surface + '80', borderColor: colors.border },
        ]}
        hitSlop={8}
      >
        <Ionicons name="share-outline" size={22} color={colors.text} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  hero: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    zIndex: 10,
  },

  // Absolutely positioned center strip between the two fixed buttons
  centerOverlay: {
    position: 'absolute',
    left: 66, // 44px btn + 14px margin + 8px gap
    right: 66,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  compactScore: {
    fontFamily: 'BricolageGrotesque_800ExtraBold',
    fontSize: 20,
    letterSpacing: -0.4,
  },

  // Rich content in normal flow, offset below the fixed top area
  richContent: {
    paddingHorizontal: 8,
  },
  scoreRow1: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
  },
  scoreRow2: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  scoreRow3: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
  },
  teamCrestCell: {
    flex: 1,
    alignItems: 'center',
  },
  teamNameCell: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  scorersCell: {
    flex: 1,
    alignItems: 'center',
  },
  scorersSpacer: {
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  scoreCenterCell: {
    width: 100,
    alignItems: 'center',
  },
  cardColHome: {
    width: 32,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  cardColAway: {
    width: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  statusCell: {
    width: 100,
    alignItems: 'center',
  },
  scoreDigitRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  scoreDigit: {
    fontFamily: 'BricolageGrotesque_800ExtraBold',
    fontSize: 40,
    lineHeight: 42,
    letterSpacing: -1,
  },
  scoreSep: {
    fontFamily: 'BricolageGrotesque_600SemiBold',
    fontSize: 40,
    lineHeight: 42,
  },
  scoreValue: {
    fontFamily: 'BricolageGrotesque_800ExtraBold',
    fontSize: 34,
    letterSpacing: -1,
    lineHeight: 38,
  },
  teamLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 17,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  statusText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10.5,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  pendingDate: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
    letterSpacing: 0.1,
  },
  leaguePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 230,
  },
  flagCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#02529c',
    flexShrink: 0,
  },
  leaguePillText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTabsAnchor: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
