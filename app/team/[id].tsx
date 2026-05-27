import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/theme/useTheme';
import { useTeamDetail } from '../../lib/hooks/useTeamDetail';
import { useFollowedTeams } from '../../lib/hooks/useFollowedTeams';
import { LEAGUES } from '../../constants/leagues';
import { TeamBadge } from '../../components/fixtures/TeamBadge';
import { TeamHeader } from '../../components/team-detail/TeamHeader';
import { TeamSubTabs, type TeamSubTabId } from '../../components/team-detail/SubTabs';
import { NextMatchCard } from '../../components/team-detail/NextMatchCard';
import { LastMatchCard } from '../../components/team-detail/LastMatchCard';
import { RecentFormGrid } from '../../components/team-detail/RecentFormGrid';
import { MiniPositionCard } from '../../components/team-detail/MiniPositionCard';
import { TopScorersList } from '../../components/team-detail/TopScorersList';
import { SeasonStatsGrid } from '../../components/team-detail/SeasonStatsGrid';
import { StadiumCard } from '../../components/team-detail/StadiumCard';

// Height of the compact top-bar content zone — mirrors HeroCollapsing's COMPACT_CONTENT_H
const CONTENT_H = 52;
// Height of the sub-tabs strip — mirrors HERO_SUBTABS_H
const SUBTABS_H = 46;
// Rough estimate for TeamHeader height before measurement fires
const TEAM_HEADER_ESTIMATE = 200;

export default function TeamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const teamId = parseInt(id ?? '0', 10);
  const router = useRouter();
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();

  // ── Hero sizing ────────────────────────────────────────────────────────────
  const TOP_BAR_H = insets.top + CONTENT_H;
  // Minimum height when fully collapsed: just top-bar + sub-tabs
  const COMPACT_H = TOP_BAR_H + SUBTABS_H;

  // ── Same gradient as HeroCollapsing ───────────────────────────────────────
  const gradStart = theme === 'dark' ? '#0b120f' : '#ecf5f0';
  const gradEnd = colors.bg;

  // ── Data ──────────────────────────────────────────────────────────────────
  const {
    team,
    leagueId,
    nextMatch,
    lastMatch,
    form,
    recentFixtures,
    standings,
    topScorers,
    seasonStats,
    teamLoading,
    scheduleLoading,
    teamError,
  } = useTeamDetail(teamId);

  const { toggle, isFollowed } = useFollowedTeams();
  const followed = isFollowed(teamId);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TeamSubTabId>('yfirlit');
  // Measured height of the TeamHeader block (crest + name + meta chips).
  // Initialised to an estimate so layout is stable on first paint.
  const [teamHeaderH, setTeamHeaderH] = useState(TEAM_HEADER_ESTIMATE);

  // Full hero height (expanded) and collapse range derived from measurement.
  const heroFull = COMPACT_H + teamHeaderH;
  const collapseRange = Math.max(teamHeaderH, 1);

  // ── Scroll-driven animations ───────────────────────────────────────────────
  const scrollY = useRef(new Animated.Value(0)).current;

  const scrollHandler = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false },
  );

  // Hero height collapses from heroFull → COMPACT_H as user scrolls
  const heroHeight = scrollY.interpolate({
    inputRange: [0, collapseRange],
    outputRange: [heroFull, COMPACT_H],
    extrapolate: 'clamp',
  });

  // Rich team header (crest + name + meta) fades + slides out in first 50 % of collapse
  const richOpacity = scrollY.interpolate({
    inputRange: [0, collapseRange * 0.5],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const richTranslateY = scrollY.interpolate({
    inputRange: [0, collapseRange],
    outputRange: [0, -18],
    extrapolate: 'clamp',
  });

  // Compact centre (badge + name) fades in during the last 35 % of collapse
  const compactOpacity = scrollY.interpolate({
    inputRange: [collapseRange * 0.6, collapseRange * 0.95],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const compactTranslateY = scrollY.interpolate({
    inputRange: [collapseRange * 0.6, collapseRange * 0.95],
    outputRange: [6, 0],
    extrapolate: 'clamp',
  });

  const leagueName = leagueId
    ? (LEAGUES as Record<number, { displayName: string }>)[leagueId]?.displayName ?? null
    : null;

  const inSupportedLeague = leagueId != null && !!(LEAGUES as Record<number, unknown>)[leagueId];

  // ── Loading / Error states ─────────────────────────────────────────────────
  if (teamLoading && !team) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (teamError && !team) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
        <Text style={[styles.errorText, { color: colors.textMuted }]}>
          Ekki tókst að sækja liðið
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={[styles.retryBtn, { borderColor: colors.border }]}
        >
          <Text style={[styles.retryText, { color: colors.text }]}>Til baka</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>

      {/* ── Hero overlay — collapses like HeroCollapsing ─────────────────────
       *  Gradient flows from top of screen through the full team header and
       *  clamps to a compact bar (back btn · badge+name · follow btn · subtabs)
       *  as the user scrolls into the content.
       * ─────────────────────────────────────────────────────────────────── */}
      <Animated.View
        style={[styles.hero, { height: heroHeight, backgroundColor: colors.surface }]}
      >
        {/* Background gradient — first child renders behind everything */}
        <LinearGradient
          colors={[gradStart, gradEnd]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          pointerEvents="none"
        />

        {/* ── Fixed top-bar controls row ──────────────────────────────────
         *  Back button (left) · animated compact centre · Follow button (right)
         *  All items share alignItems:'center' in the CONTENT_H zone, exactly
         *  mirroring HeroCollapsing's fixed-button pattern.
         * ──────────────────────────────────────────────────────────────── */}
        <View
          style={[
            styles.topBarContent,
            { position: 'absolute', top: insets.top, left: 0, right: 0 },
          ]}
        >
          {/* Back button — 44 × 44 circle */}
          <Pressable
            onPress={() => router.back()}
            style={[
              styles.roundBtn,
              { borderColor: colors.border, backgroundColor: colors.surface + '80' },
            ]}
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>

          {/* Compact centre — badge + name, fades in as hero collapses */}
          <Animated.View
            style={[
              styles.topBarCenter,
              { opacity: compactOpacity, transform: [{ translateY: compactTranslateY }] },
            ]}
            pointerEvents="none"
          >
            {team && (
              <View style={styles.topBarTeamRow}>
                <TeamBadge
                  imageUrl={team.image_path ?? ''}
                  shortCode={team.short_code ?? team.name.slice(0, 3)}
                  size={26}
                />
                <Text
                  style={[styles.topBarTitleText, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {team.name}
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Follow button */}
          <Pressable
            onPress={() => toggle(teamId)}
            style={({ pressed }) => [
              styles.followBtn,
              followed
                ? { backgroundColor: colors.goldSoft, borderColor: colors.gold + '66' }
                : { backgroundColor: colors.accentSoft, borderColor: colors.accent + '55' },
              pressed && { opacity: 0.75 },
            ]}
            hitSlop={4}
          >
            <Ionicons
              name={followed ? 'star' : 'star-outline'}
              size={14}
              color={followed ? colors.gold : colors.accent}
            />
            <Text style={[styles.followText, { color: followed ? colors.gold : colors.accent }]}>
              {followed ? 'Fylgist með' : 'Fylgjast'}
            </Text>
          </Pressable>
        </View>

        {/* ── Rich team header — fades + slides up as hero collapses ───── */}
        {team && (
          <Animated.View
            style={{
              marginTop: TOP_BAR_H,
              opacity: richOpacity,
              transform: [{ translateY: richTranslateY }],
            }}
          >
            <TeamHeader
              team={team}
              leagueName={leagueName}
              onLayout={setTeamHeaderH}
            />
          </Animated.View>
        )}

        {/* Sub-tabs strip — pinned to the bottom of the hero at all times */}
        <View style={styles.subTabsAnchor}>
          <TeamSubTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </View>
      </Animated.View>

      {/* ── Scrollable content — starts below the full (expanded) hero ───── */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: heroFull, paddingBottom: insets.bottom + 110 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Yfirlit tab ──────────────────────────────────────────────── */}
        {activeTab === 'yfirlit' && (
          <YfirliContent
            teamId={teamId}
            leagueName={leagueName}
            inSupportedLeague={inSupportedLeague}
            nextMatch={nextMatch}
            lastMatch={lastMatch}
            form={form}
            recentFixtures={recentFixtures}
            standings={standings}
            topScorers={topScorers}
            seasonStats={seasonStats}
            venue={team?.venue ?? null}
            scheduleLoading={scheduleLoading}
          />
        )}

        {/* ── Placeholder tabs ─────────────────────────────────────────── */}
        {activeTab !== 'yfirlit' && <PlaceholderContent />}
      </Animated.ScrollView>
    </View>
  );
}

// ── Yfirlit content ────────────────────────────────────────────────────────────

interface YfirliProps {
  teamId: number;
  leagueName: string | null;
  inSupportedLeague: boolean;
  nextMatch: import('../../lib/api/types').Fixture | null;
  lastMatch: import('../../lib/api/types').Fixture | null;
  form: import('../../lib/utils/form').FormEntry[];
  recentFixtures: import('../../lib/api/types').Fixture[];
  standings: import('../../lib/api/types').StandingRow[] | null;
  topScorers: import('../../lib/api/teamDetail').TopScorerEntry[];
  seasonStats: import('../../lib/hooks/useTeamDetail').SeasonStats | null;
  venue: import('../../lib/api/teamDetail').TeamVenue | null | undefined;
  scheduleLoading: boolean;
}

function YfirliContent({
  teamId,
  leagueName,
  inSupportedLeague,
  nextMatch,
  lastMatch,
  form,
  recentFixtures,
  standings,
  topScorers,
  seasonStats,
  venue,
  scheduleLoading,
}: YfirliProps) {
  const { colors } = useTheme();
  return (
    <>
      {/* Leikir section — next + last match cards side by side */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Leikir</Text>
      </View>

      {scheduleLoading && !nextMatch && !lastMatch ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" />
        </View>
      ) : (
        <View style={styles.matchCardsRow}>
          <NextMatchCard fixture={nextMatch} />
          <LastMatchCard fixture={lastMatch} teamId={teamId} />
        </View>
      )}

      {/* Form — only if we have data */}
      {form.length > 0 && (
        <RecentFormGrid form={form} fixtures={recentFixtures} teamId={teamId} />
      )}

      {/* Mini position — only for supported leagues */}
      {inSupportedLeague && standings && standings.length > 0 && (
        <MiniPositionCard
          standings={standings as any}
          teamId={teamId}
          leagueName={leagueName}
        />
      )}

      {/* Top scorers — only if we have any */}
      {inSupportedLeague && topScorers.length > 0 && (
        <TopScorersList scorers={topScorers} />
      )}

      {/* Season stats — only for supported leagues */}
      {inSupportedLeague && seasonStats && (
        <SeasonStatsGrid stats={seasonStats} />
      )}

      {/* Stadium — only if venue data exists */}
      {venue && <StadiumCard venue={venue} />}

      <View style={{ height: 32 }} />
    </>
  );
}

function PlaceholderContent() {
  const { colors } = useTheme();
  return (
    <View style={styles.placeholderWrap}>
      <Text style={[styles.placeholderText, { color: colors.textMuted }]}>
        Kemur fljótlega
      </Text>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  scrollContent: {},

  // Collapsing hero overlay — same structural pattern as HeroCollapsing
  hero: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden', // clips the rich team header as it slides out of view
    zIndex: 10,
  },

  // CONTENT_H-tall controls row: back btn · flex centre · follow btn
  topBarContent: {
    height: CONTENT_H,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },

  // 44 × 44 circle button — identical to HeroCollapsing's roundBtn
  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // Flexible centre slot — compact badge + name fades in here
  topBarCenter: {
    flex: 1,
    alignItems: 'center',
  },
  topBarTeamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topBarTitleText: {
    fontFamily: 'BricolageGrotesque_700Bold',
    fontSize: 16,
    letterSpacing: -0.2,
    flexShrink: 1,
  },

  // Follow pill button
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    flexShrink: 0,
  },
  followText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12.5,
  },

  // Sub-tabs pinned to the bottom of the hero at all scroll positions
  subTabsAnchor: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },

  // Content sections
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionLabel: {
    fontFamily: 'BricolageGrotesque_700Bold',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  matchCardsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
  },
  loadingRow: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Placeholder
  placeholderWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  placeholderText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 15,
  },

  // Error
  errorText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 15,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  retryText: { fontFamily: 'Manrope_700Bold', fontSize: 14 },
});
