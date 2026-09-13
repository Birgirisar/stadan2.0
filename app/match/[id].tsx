import { Ionicons } from '@expo/vector-icons';
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
import { LEAGUES } from '../../constants/leagues';
import { useMatchDetail } from '../../lib/hooks/useMatchDetail';
import { useTeamForm } from '../../lib/hooks/useTeamForm';
import { useStandings } from '../../lib/hooks/useStandings';
import { useAggregateScores } from '../../lib/hooks/useAggregateScores';
import { getScore } from '../../lib/utils/score';
import { getMatchState } from '../../lib/utils/state';
import { getAvailableSubTabs } from '../../lib/utils/matchSubTabs';
import { HeroCollapsing, HERO_SUBTABS_H } from '../../components/match-detail/HeroCollapsing';
import { type SubTabId } from '../../components/match-detail/SubTabs';
import { EventTimeline } from '../../components/match-detail/EventTimeline';
import { ManOfTheMatchCard } from '../../components/match-detail/ManOfTheMatchCard';
import { RecentForm } from '../../components/match-detail/RecentForm';
import { MiniLeagueTable } from '../../components/match-detail/MiniLeagueTable';
import { PlaceholderTab } from '../../components/match-detail/PlaceholderTab';
import { LineupTab } from '../../components/match-detail/lineup/LineupTab';
import { CommentaryTab } from '../../components/match-detail/commentary/CommentaryTab';
import { TaflaTab } from '../../components/match-detail/TaflaTab';
import { H2HTab } from '../../components/match-detail/h2h/H2HTab';

// Estimated hero base height before measurement (without insets.top), includes subtabs
const HERO_BASE_ESTIMATE = 246;
const HERO_COLLAPSED_BASE = 52;

function computeMotm(fixture: import('../../lib/api/types').DetailedFixture) {
  const metaId = fixture.meta?.man_of_the_match as number | null | undefined;
  const lineups = fixture.lineups ?? [];

  if (metaId) {
    const entry = lineups.find((l) => l.player_id === metaId);
    if (entry?.player) {
      return {
        playerName: entry.player.name,
        teamName: fixture.participants?.find((p) => p.id === entry.team_id)?.name ?? '',
        position: entry.position ?? null,
        rating: entry.rating ?? null,
      };
    }
  }

  let best: (typeof lineups)[0] | null = null;
  for (const entry of lineups) {
    if (entry.rating != null && (!best || (best.rating ?? 0) < entry.rating)) best = entry;
  }

  if (best?.player) {
    return {
      playerName: best.player.name,
      teamName: fixture.participants?.find((p) => p.id === best!.team_id)?.name ?? '',
      position: best.position ?? null,
      rating: best.rating ?? null,
    };
  }

  return null;
}

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const scrollY = useRef(new Animated.Value(0)).current;
  // ScrollView is the correct ref type — Animated.ScrollView wraps it and
  // proxies scrollTo / getScrollableNode at runtime.
  const scrollViewRef = useRef<import('react-native').ScrollView>(null);
  // Each panel owns its own position so only the two panels involved in a
  // transition animate — the third is snapped off-screen invisibly.
  const currentPanelX = useRef(new Animated.Value(0)).current;
  const prevPanelX = useRef(new Animated.Value(-screenWidth)).current;
  const nextPanelX = useRef(new Animated.Value(screenWidth)).current;
  const currentPanelOpacity = useRef(new Animated.Value(1)).current;
  const screenWidthRef = useRef(screenWidth);
  const prevTabIdRef = useRef<SubTabId | null>(null);
  const nextTabIdRef = useRef<SubTabId | null>(null);
  const isCommittingRef = useRef(false);
  const scrollYRef = useRef(0);
  const collapseRangeRef = useRef(0);
  const [frozenPrevTab, setFrozenPrevTab] = useState<SubTabId | null>(null);
  const [frozenNextTab, setFrozenNextTab] = useState<SubTabId | null>(null);
  const [activeTab, setActiveTab] = useState<SubTabId>('yfirlit');

  // Dynamic hero height — starts with an estimate, updated after onLayout fires
  const [heroFull, setHeroFull] = useState(HERO_BASE_ESTIMATE + insets.top);
  const HERO_COLLAPSED = HERO_COLLAPSED_BASE + HERO_SUBTABS_H + insets.top;
  const collapseRange = Math.max(heroFull - HERO_COLLAPSED, 1);
  collapseRangeRef.current = collapseRange;

  const { data: fixture, isLoading, isFetching, error, refetch } = useMatchDetail(id);

  const home = fixture?.participants?.find((p) => p.meta.location === 'home');
  const away = fixture?.participants?.find((p) => p.meta.location === 'away');
  const score = fixture ? getScore(fixture) : { home: null, away: null };
  const stateResult = fixture ? getMatchState(fixture.state) : null;
  const isPending = stateResult?.type === 'pending';
  const isFinished = stateResult?.type === 'finished';
  const isLive = stateResult?.type === 'live';
  const venueName = fixture?.venue?.name ?? '';
  const leagueName = LEAGUES[fixture?.league_id as keyof typeof LEAGUES]?.displayName ?? fixture?.league?.name ?? '';

  const seasonId =
    (fixture?.league as any)?.current_season_id ??
    fixture?.season_id ??
    undefined;

  const { data: homeForm, isLoading: homeFormLoading } = useTeamForm(home?.id, seasonId);
  const { data: awayForm, isLoading: awayFormLoading } = useTeamForm(away?.id, seasonId);
  const { data: standings } = useStandings(seasonId);

  const aggregateByFixtureId = useAggregateScores(fixture ? [fixture] : []);
  const aggregateLabel = fixture ? aggregateByFixtureId.get(fixture.id) : undefined;

  const motm = fixture ? computeMotm(fixture) : null;

  // If the active tab is no longer in the available list (e.g. fixture state
  // changed), fall back to Yfirlit.
  useEffect(() => {
    if (!fixture) return;
    const available = getAvailableSubTabs(fixture);
    if (!available.find((t) => t.id === activeTab)) {
      setActiveTab('yfirlit');
    }
  }, [fixture]);

  // Ref so PanResponder closure always sees latest tab state without being recreated
  const shiftTab = useRef<(delta: number) => void>(() => {});
  useEffect(() => {
    shiftTab.current = (delta: number) => {
      if (!fixture) return;
      const available = getAvailableSubTabs(fixture);
      const currentIdx = available.findIndex((t) => t.id === activeTab);
      if (currentIdx === -1) return;
      const nextIdx = currentIdx + delta;
      if (nextIdx >= 0 && nextIdx < available.length) {
        setActiveTab(available[nextIdx].id);
      }
    };
  }, [fixture, activeTab]);

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => { scrollYRef.current = value; });
    return () => scrollY.removeListener(id);
  }, []);

  // After setActiveTab commits and the frozen panel has been visible for one
  // paint, snap all panels back to resting positions.
  // useEffect (fires after paint) + useNativeDriver: false means the setValue
  // calls go through the same UIManager batch as React tree updates — no race.
  useEffect(() => {
    if (!isCommittingRef.current) return;
    isCommittingRef.current = false;
    const sw = screenWidthRef.current;
    currentPanelX.setValue(0);
    currentPanelOpacity.setValue(1);
    prevPanelX.setValue(-sw);
    nextPanelX.setValue(sw);
    // Clear frozen panels after positions have been snapped (next frame so
    // content change while panels are off-screen is invisible)
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

  const panResponder = useRef(
    PanResponder.create({
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
            // Swipe left: current exits left, next enters — snap prev (already off-screen)
            prevPanelX.setValue(-sw);
            Animated.parallel([
              Animated.timing(currentPanelX, { toValue: -sw, duration: 220, useNativeDriver: false }),
              Animated.timing(nextPanelX, { toValue: 0, duration: 220, useNativeDriver: false }),
            ]).start(() => {
              // Reset scroll to top while preserving hero collapse state
              const cy = scrollYRef.current;
              const range = collapseRangeRef.current;
              scrollViewRef.current?.scrollTo({ y: cy >= range ? range : 0, animated: false });
              // Freeze next panel content so it doesn't flash when nextTabId
              // changes in the re-render triggered by setActiveTab below
              setFrozenNextTab(nextTabIdRef.current);
              currentPanelOpacity.setValue(0);
              isCommittingRef.current = true;
              shiftTab.current(delta);
            });
          } else {
            // Swipe right: current exits right, prev enters — snap next (already off-screen)
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
              shiftTab.current(delta);
            });
          }
        } else {
          springBack();
        }
      },
      onPanResponderTerminate: () => springBack(),
    })
  ).current;

  const scrollHandler = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false },
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.textMuted} size="large" />
      </View>
    );
  }

  if (error || !fixture) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg, paddingTop: insets.top + 20 }]}>
        <Text style={[styles.errorText, { color: colors.textMuted }]}>
          Ekki tókst að sækja leikinn
        </Text>
        <Pressable onPress={() => refetch()} style={[styles.retryBtn, { borderColor: colors.border }]}>
          <Text style={[styles.retryText, { color: colors.text }]}>Reyna aftur</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={[styles.backLinkText, { color: colors.accent }]}>Til baka</Text>
        </Pressable>
      </View>
    );
  }

  // Compute which tabs flank the active one — update refs used by PanResponder closure
  const availableTabs = getAvailableSubTabs(fixture);
  const currentTabIdx = availableTabs.findIndex((t) => t.id === activeTab);
  const prevTabId = currentTabIdx > 0 ? availableTabs[currentTabIdx - 1].id : null;
  const nextTabId = currentTabIdx < availableTabs.length - 1 ? availableTabs[currentTabIdx + 1].id : null;
  prevTabIdRef.current = prevTabId;
  nextTabIdRef.current = nextTabId;
  screenWidthRef.current = screenWidth; // keep in sync for PanResponder closure

  const renderTabContent = (tabId: SubTabId, preview = false) => {
    switch (tabId) {
      case 'yfirlit':
        return (
          <YfirliContent
            fixture={fixture}
            homeTeamId={home?.id}
            awayTeamId={away?.id}
            homeGoals={score.home}
            awayGoals={score.away}
            isFinished={isFinished ?? false}
            isPending={isPending ?? false}
            isLive={isLive ?? false}
            motm={motm}
            homeForm={homeForm}
            awayForm={awayForm}
            homeFormLoading={homeFormLoading}
            awayFormLoading={awayFormLoading}
            standings={standings}
            venueName={venueName}
            leagueName={leagueName}
            colors={colors}
          />
        );
      case 'lidin':
        return <LineupTab fixture={fixture} />;
      case 'lysing':
        return (
          <CommentaryTab
            fixtureId={fixture.id}
            isLive={stateResult?.type === 'live' || stateResult?.type === 'halftime'}
          />
        );
      case 'tafla':
        return (
          <TaflaTab
            seasonId={seasonId}
            leagueId={fixture.league_id}
            homeTeamId={home?.id}
            awayTeamId={away?.id}
            liveTeamIds={new Set<number>()}
            scrollRef={preview ? undefined : scrollViewRef}
            heroFull={heroFull}
            heroCollapsedH={HERO_COLLAPSED}
          />
        );
      case 'innbyrðis':
        return (
          <H2HTab
            homeTeam={home}
            awayTeam={away}
            currentFixtureId={fixture.id}
          />
        );
      default:
        return <PlaceholderTab />;
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]} {...panResponder.panHandlers}>
      {/* Previous tab — off-screen left, slides into view on right swipe */}
      {/* frozenPrevTab keeps content stable during commit so prev panel doesn't flash wrong content */}
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

      {/* Next tab — off-screen right, slides into view on left swipe */}
      {/* frozenNextTab keeps content stable during commit so next panel doesn't flash wrong content */}
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

      {/* Current tab — interactive, with vertical scroll */}
      <Animated.View style={{ flex: 1, transform: [{ translateX: currentPanelX }], opacity: currentPanelOpacity }}>
        <Animated.ScrollView
          ref={scrollViewRef}
          onScroll={scrollHandler}
          scrollEventThrottle={1}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: heroFull, paddingBottom: insets.bottom + 110, minHeight: screenHeight + collapseRange },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={refetch}
              tintColor={colors.text}
              colors={[colors.text]}
              progressViewOffset={heroFull}
            />
          }
        >
          {renderTabContent(activeTab)}
        </Animated.ScrollView>
      </Animated.View>

      {/* Animated hero overlay — always on top */}
      <HeroCollapsing
        fixture={fixture}
        scrollY={scrollY}
        collapseRange={collapseRange}
        insetTop={insets.top}
        heroFull={heroFull}
        onBack={() => router.back()}
        onFullHeightMeasured={(h) => setHeroFull(h)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        aggregateLabel={aggregateLabel}
      />
    </View>
  );
}

// ── Yfirlit content ────────────────────────────────────────────

interface YfirliProps {
  fixture: import('../../lib/api/types').DetailedFixture;
  homeTeamId: number | undefined;
  awayTeamId: number | undefined;
  homeGoals: number | null;
  awayGoals: number | null;
  isFinished: boolean;
  isPending: boolean;
  isLive: boolean;
  motm: ReturnType<typeof computeMotm>;
  homeForm: import('../../lib/api/types').Fixture[] | undefined;
  awayForm: import('../../lib/api/types').Fixture[] | undefined;
  homeFormLoading: boolean;
  awayFormLoading: boolean;
  standings: import('../../lib/api/types').Standing[] | undefined;
  venueName: string;
  leagueName: string;
  colors: ReturnType<typeof import('../../lib/theme/useTheme').useTheme>['colors'];
}

function YfirliContent({
  fixture,
  homeTeamId,
  awayTeamId,
  homeGoals,
  awayGoals,
  isFinished,
  isPending,
  isLive,
  motm,
  homeForm,
  awayForm,
  homeFormLoading,
  awayFormLoading,
  standings,
  venueName,
  leagueName,
  colors,
}: YfirliProps) {
  return (
    <>
      {/* Venue strip — just below the subtab bar */}
      {!!venueName && (
        <View style={[styles.venueStrip, { borderColor: colors.border }]}>
          <Ionicons name="location-outline" size={12} color={colors.textMuted} />
          <Text style={[styles.venueText, { color: colors.textMuted }]} numberOfLines={1}>
            {venueName}
          </Text>
        </View>
      )}

      {/* MOTM — only for finished matches */}
      {!isPending && motm && (
        <ManOfTheMatchCard
          playerName={motm.playerName}
          teamName={motm.teamName}
          position={motm.position}
          rating={motm.rating}
        />
      )}

      {/* Event timeline — hidden for pre-match */}
      {!isPending && fixture.events && fixture.events.length > 0 && homeTeamId != null && (
        <EventTimeline
          events={fixture.events}
          homeTeamId={homeTeamId}
          homeGoals={homeGoals}
          awayGoals={awayGoals}
          isFinished={isFinished}
        />
      )}

      {/* Empty state — live match, no events recorded yet */}
      {isLive && (!fixture.events || fixture.events.length === 0) && (
        <View style={[styles.eventsEmpty, { borderColor: colors.border }]}>
          <Ionicons name="football" size={14} color={colors.textMuted} />
          <Text style={[styles.eventsEmptyText, { color: colors.textMuted }]}>
            Engir skráðir atburðir enn
          </Text>
        </View>
      )}

      {/* Recent form */}
      {homeTeamId != null && awayTeamId != null && (
        <RecentForm
          homeTeamId={homeTeamId}
          awayTeamId={awayTeamId}
          homeFixtures={homeForm}
          awayFixtures={awayForm}
          homeLoading={homeFormLoading}
          awayLoading={awayFormLoading}
          leagueName={leagueName}
        />
      )}

      {/* Mini league table */}
      {standings && homeTeamId != null && awayTeamId != null && (
        <MiniLeagueTable
          standings={standings}
          homeTeamId={homeTeamId}
          awayTeamId={awayTeamId}
        />
      )}
    </>
  );
}


const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: {},
  venueStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingTop: 16,
  },
  venueText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    flexShrink: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
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
  backLink: { marginTop: 8 },
  backLinkText: { fontFamily: 'Manrope_600SemiBold', fontSize: 14 },
  eventsEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 20,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  eventsEmptyText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13.5,
  },
});
