import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  PanResponder,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/theme/useTheme';
import { useTeamDetail } from '../../lib/hooks/useTeamDetail';
import { useTeamFixtures } from '../../lib/hooks/useTeamFixtures';
import { useFollowedTeams } from '../../lib/hooks/useFollowedTeams';
import { LEAGUES } from '../../constants/leagues';
import { TeamBadge } from '../../components/fixtures/TeamBadge';
import { TeamHeader } from '../../components/team-detail/TeamHeader';
import { TeamSubTabs, type TeamSubTabId } from '../../components/team-detail/SubTabs';
import { TeamLeikirTab } from '../../components/team-detail/leikir/TeamLeikirTab';
import { NextMatchCard } from '../../components/team-detail/NextMatchCard';
import { LastMatchCard } from '../../components/team-detail/LastMatchCard';
import { RecentFormGrid } from '../../components/team-detail/RecentFormGrid';
import { MiniPositionCard } from '../../components/team-detail/MiniPositionCard';
import { TopScorersList } from '../../components/team-detail/TopScorersList';
import { SeasonStatsGrid } from '../../components/team-detail/SeasonStatsGrid';
import { StadiumCard } from '../../components/team-detail/StadiumCard';

const CONTENT_H = 52;
const SUBTABS_H = 46;
const TEAM_HEADER_ESTIMATE = 200;

const TEAM_TABS: readonly TeamSubTabId[] = ['yfirlit', 'leikir', 'leikmenn', 'timabil'];

export default function TeamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const teamId = parseInt(id ?? '0', 10);
  const router = useRouter();
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const TOP_BAR_H = insets.top + CONTENT_H;
  const COMPACT_H = TOP_BAR_H + SUBTABS_H;

  const gradStart = theme === 'dark' ? '#0b120f' : '#ecf5f0';
  const gradEnd = colors.bg;

  // ── Data ──────────────────────────────────────────────────────────────────
  const {
    team,
    seasonId,
    leagueId,
    nextMatch,
    lastMatch,
    form,
    recentFixtures,
    standings,
    topScorers,
    topAssists,
    seasonStats,
    teamLoading,
    scheduleLoading,
    teamError,
  } = useTeamDetail(teamId);

  const { toggle, isFollowed } = useFollowedTeams();
  const followed = isFollowed(teamId);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TeamSubTabId>('yfirlit');
  const [teamHeaderH, setTeamHeaderH] = useState(TEAM_HEADER_ESTIMATE);

  const scrollViewRef = useRef<import('react-native').ScrollView>(null);

  // ── Leikir tab data ────────────────────────────────────────────────────────
  const {
    fixtures: leikirFixtures,
    isLoading: leikirLoading,
    error: leikirError,
    refetch: refetchLeikir,
    isRefetching: leikirRefetching,
  } = useTeamFixtures(teamId, activeTab === 'leikir' ? (seasonId ?? undefined) : undefined);

  // ── Hero sizing ────────────────────────────────────────────────────────────
  const heroFull = COMPACT_H + teamHeaderH;
  const collapseRange = Math.max(teamHeaderH, 1);

  // ── Scroll-driven animations (useNativeDriver: false — hero needs layout) ─
  const scrollY = useRef(new Animated.Value(0)).current;

  const scrollHandler = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false },
  );

  const heroHeight = scrollY.interpolate({
    inputRange: [0, collapseRange],
    outputRange: [heroFull, COMPACT_H],
    extrapolate: 'clamp',
  });
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

  // ── Panel animations ───────────────────────────────────────────────────────
  // useNativeDriver: false keeps setValue in useEffect batched with React tree
  // updates so there is no race-condition flash on commit.
  const currentPanelX = useRef(new Animated.Value(0)).current;
  const prevPanelX = useRef(new Animated.Value(-screenWidth)).current;
  const nextPanelX = useRef(new Animated.Value(screenWidth)).current;
  const currentPanelOpacity = useRef(new Animated.Value(1)).current;
  const screenWidthRef = useRef(screenWidth);
  const activeTabRef = useRef(activeTab);
  const prevTabIdRef = useRef<TeamSubTabId | null>(null);
  const nextTabIdRef = useRef<TeamSubTabId | null>(null);
  const isCommittingRef = useRef(false);
  const scrollYRef = useRef(0);
  const collapseRangeRef = useRef(collapseRange);
  const [frozenPrevTab, setFrozenPrevTab] = useState<TeamSubTabId | null>(null);
  const [frozenNextTab, setFrozenNextTab] = useState<TeamSubTabId | null>(null);

  // Keep refs in sync every render
  const currentTabIdx = TEAM_TABS.indexOf(activeTab);
  const prevTabId: TeamSubTabId | null = currentTabIdx > 0 ? TEAM_TABS[currentTabIdx - 1] : null;
  const nextTabId: TeamSubTabId | null = currentTabIdx < TEAM_TABS.length - 1 ? TEAM_TABS[currentTabIdx + 1] : null;
  prevTabIdRef.current = prevTabId;
  nextTabIdRef.current = nextTabId;
  screenWidthRef.current = screenWidth;
  activeTabRef.current = activeTab;
  collapseRangeRef.current = collapseRange;

  useEffect(() => {
    const listenerId = scrollY.addListener(({ value }) => { scrollYRef.current = value; });
    return () => scrollY.removeListener(listenerId);
  }, []);

  useEffect(() => {
    if (!isCommittingRef.current) return;
    isCommittingRef.current = false;
    const sw = screenWidthRef.current;
    currentPanelX.setValue(0);
    currentPanelOpacity.setValue(1);
    prevPanelX.setValue(-sw);
    nextPanelX.setValue(sw);
    requestAnimationFrame(() => {
      setFrozenPrevTab(null);
      setFrozenNextTab(null);
    });
  }, [activeTab]);

  const springBack = () => {
    const sw = screenWidthRef.current;
    Animated.parallel([
      Animated.spring(currentPanelX, { toValue: 0, tension: 120, friction: 10, useNativeDriver: false }),
      Animated.spring(prevPanelX, { toValue: -sw, tension: 120, friction: 10, useNativeDriver: false }),
      Animated.spring(nextPanelX, { toValue: sw, tension: 120, friction: 10, useNativeDriver: false }),
    ]).start();
  };

  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, { dx, dy }) =>
      Math.abs(dx) > Math.abs(dy) * 1.5 && Math.abs(dx) > 12,
    onPanResponderMove: (_, { dx }) => {
      const clamped =
        (dx > 0 && !prevTabIdRef.current) || (dx < 0 && !nextTabIdRef.current)
          ? dx * 0.25
          : dx;
      currentPanelX.setValue(clamped);
      prevPanelX.setValue(-screenWidthRef.current + clamped);
      nextPanelX.setValue(screenWidthRef.current + clamped);
    },
    onPanResponderRelease: (_, { dx }) => {
      if (
        Math.abs(dx) > 100 &&
        ((dx < 0 && nextTabIdRef.current) || (dx > 0 && prevTabIdRef.current))
      ) {
        const delta = dx < 0 ? 1 : -1;
        const sw = screenWidthRef.current;
        if (delta === 1) {
          prevPanelX.setValue(-sw);
          Animated.parallel([
            Animated.timing(currentPanelX, { toValue: -sw, duration: 220, useNativeDriver: false }),
            Animated.timing(nextPanelX, { toValue: 0, duration: 220, useNativeDriver: false }),
          ]).start(() => {
            const cy = scrollYRef.current;
            const range = collapseRangeRef.current;
            scrollViewRef.current?.scrollTo({ y: cy >= range ? range : 0, animated: false });
            setFrozenNextTab(nextTabIdRef.current);
            currentPanelOpacity.setValue(0);
            isCommittingRef.current = true;
            const idx = TEAM_TABS.indexOf(activeTabRef.current);
            if (idx + 1 < TEAM_TABS.length) setActiveTab(TEAM_TABS[idx + 1]);
          });
        } else {
          nextPanelX.setValue(sw);
          Animated.parallel([
            Animated.timing(currentPanelX, { toValue: sw, duration: 220, useNativeDriver: false }),
            Animated.timing(prevPanelX, { toValue: 0, duration: 220, useNativeDriver: false }),
          ]).start(() => {
            const cy = scrollYRef.current;
            const range = collapseRangeRef.current;
            scrollViewRef.current?.scrollTo({ y: cy >= range ? range : 0, animated: false });
            setFrozenPrevTab(prevTabIdRef.current);
            currentPanelOpacity.setValue(0);
            isCommittingRef.current = true;
            const idx = TEAM_TABS.indexOf(activeTabRef.current);
            if (idx - 1 >= 0) setActiveTab(TEAM_TABS[idx - 1]);
          });
        }
      } else {
        springBack();
      }
    },
    onPanResponderTerminate: () => springBack(),
  })).current;

  const leagueName = leagueId
    ? (LEAGUES as Record<number, { displayName: string }>)[leagueId]?.displayName ?? null
    : null;
  const inSupportedLeague = leagueId != null && !!(LEAGUES as Record<number, unknown>)[leagueId];

  // ── Loading / Error states ─────────────────────────────────────────────────
  if (teamLoading && !team) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.textMuted} size="large" />
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

  const renderTabContent = (tabId: TeamSubTabId, preview = false) => {
    switch (tabId) {
      case 'yfirlit':
        return (
          <YfirliContent
            teamId={teamId}
            leagueId={leagueId}
            leagueName={leagueName}
            inSupportedLeague={inSupportedLeague}
            nextMatch={nextMatch}
            lastMatch={lastMatch}
            form={form}
            recentFixtures={recentFixtures}
            standings={standings}
            topScorers={topScorers}
            topAssists={topAssists}
            seasonStats={seasonStats}
            venue={team?.venue ?? null}
            scheduleLoading={scheduleLoading}
          />
        );
      case 'leikir':
        return (
          <TeamLeikirTab
            seasonId={seasonId}
            fixtures={leikirFixtures}
            isLoading={leikirLoading}
            error={leikirError}
            onRetry={refetchLeikir}
            scrollViewRef={preview ? undefined : scrollViewRef}
            heroFull={heroFull}
            compactH={COMPACT_H}
          />
        );
      default:
        return <PlaceholderContent />;
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]} {...panResponder.panHandlers}>

      {/* Previous tab panel — off-screen left */}
      {(frozenPrevTab ?? prevTabId) && (
        <Animated.View
          style={[StyleSheet.absoluteFill, { transform: [{ translateX: prevPanelX }] }]}
          pointerEvents="none"
        >
          <View style={{ paddingTop: heroFull }}>
            {renderTabContent((frozenPrevTab ?? prevTabId)!, true)}
          </View>
        </Animated.View>
      )}

      {/* Next tab panel — off-screen right */}
      {(frozenNextTab ?? nextTabId) && (
        <Animated.View
          style={[StyleSheet.absoluteFill, { transform: [{ translateX: nextPanelX }] }]}
          pointerEvents="none"
        >
          <View style={{ paddingTop: heroFull }}>
            {renderTabContent((frozenNextTab ?? nextTabId)!, true)}
          </View>
        </Animated.View>
      )}

      {/* Current tab — interactive with vertical scroll */}
      <Animated.View style={{ flex: 1, transform: [{ translateX: currentPanelX }], opacity: currentPanelOpacity }}>
        <Animated.ScrollView
          ref={scrollViewRef}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: heroFull, paddingBottom: insets.bottom + 110 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            activeTab === 'leikir' ? (
              <RefreshControl
                refreshing={leikirRefetching}
                onRefresh={refetchLeikir}
                tintColor={colors.textMuted}
              />
            ) : undefined
          }
        >
          {renderTabContent(activeTab)}
        </Animated.ScrollView>
      </Animated.View>

      {/* Hero overlay — rendered last so it sits above all panels (zIndex: 10) */}
      <Animated.View
        style={[styles.hero, { height: heroHeight, backgroundColor: colors.surface }]}
      >
        <LinearGradient
          colors={[gradStart, gradEnd]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          pointerEvents="none"
        />

        <View
          style={[
            styles.topBarContent,
            { position: 'absolute', top: insets.top, left: 0, right: 0 },
          ]}
        >
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
                  teamId={team.id}
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
              {followed ? 'Fylgist með' : 'Fylgja'}
            </Text>
          </Pressable>
        </View>

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

        <View style={styles.subTabsAnchor}>
          <TeamSubTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </View>
      </Animated.View>

    </View>
  );
}

// ── Yfirlit content ────────────────────────────────────────────────────────────

interface YfirliProps {
  teamId: number;
  leagueId: number | null;
  leagueName: string | null;
  inSupportedLeague: boolean;
  nextMatch: import('../../lib/api/types').Fixture | null;
  lastMatch: import('../../lib/api/types').Fixture | null;
  form: import('../../lib/utils/form').FormEntry[];
  recentFixtures: import('../../lib/api/types').Fixture[];
  standings: import('../../lib/api/types').StandingRow[] | null;
  topScorers: import('../../lib/api/teamDetail').TopScorerEntry[];
  topAssists: import('../../lib/api/teamDetail').TopScorerEntry[];
  seasonStats: import('../../lib/hooks/useTeamDetail').SeasonStats | null;
  venue: import('../../lib/api/teamDetail').TeamVenue | null | undefined;
  scheduleLoading: boolean;
}

function YfirliContent({
  teamId,
  leagueId,
  leagueName,
  inSupportedLeague,
  nextMatch,
  lastMatch,
  form,
  recentFixtures,
  standings,
  topScorers,
  topAssists,
  seasonStats,
  venue,
  scheduleLoading,
}: YfirliProps) {
  const { colors } = useTheme();
  return (
    <>
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

      {form.length > 0 && (
        <RecentFormGrid form={form} fixtures={recentFixtures} teamId={teamId} />
      )}

      {inSupportedLeague && standings && standings.length > 0 && (
        <MiniPositionCard
          standings={standings as any}
          teamId={teamId}
          leagueName={leagueName}
          leagueId={leagueId}
        />
      )}

      {inSupportedLeague && topScorers.length > 0 && (
        <TopScorersList scorers={topScorers} />
      )}

      {inSupportedLeague && topAssists.length > 0 && (
        <TopScorersList scorers={topAssists} title="Stoðsendingar" />
      )}

      {inSupportedLeague && seasonStats && (
        <SeasonStatsGrid stats={seasonStats} />
      )}

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

  hero: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    zIndex: 10,
  },

  topBarContent: {
    height: CONTENT_H,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },

  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

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

  subTabsAnchor: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },

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
