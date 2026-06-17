import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Animated,
  Image,
  ImageSourcePropType,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

const LOCAL_LEAGUE_IMAGES: Record<number, ImageSourcePropType> = {
  345:  require('../../assets/leagues/besta-deild.png'),
  1710: require('../../assets/leagues/besta-deild.png'),
  348:  require('../../assets/leagues/lengju-deild.jpeg'),
  1711: require('../../assets/leagues/lengju-deild.jpeg'),
};
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/theme/useTheme';
import { useQuery } from '@tanstack/react-query';
import { useLeagueMeta, useLeagueStandingsGrouped } from '../../lib/hooks/useLeagueDetail';
import { fetchTopScorers } from '../../lib/api/teamDetail';
import { useFixturesByDate } from '../../lib/api/fixtures';
import { useLeagueFixtures } from '../../lib/hooks/useLeagueFixtures';
import { getLiveTeamIds } from '../../lib/utils/liveTeams';
import {
  LEAGUES,
  EFRI_HLUTI_ZONE_RULES,
  NEDRI_HLUTI_ZONE_RULES,
  EFRI_HLUTI_ZONE_LABELS,
  NEDRI_HLUTI_ZONE_LABELS,
  type ZoneLabels,
} from '../../constants/leagues';
import { LeagueSubTabs, SUBTABS_HEIGHT, type LeagueSubTabId } from './LeagueSubTabs';
import { ViewToggle, type ViewMode } from './ViewToggle';
import { StandingsTable } from './StandingsTable';
import { SeasonDropdown } from './SeasonDropdown';
import { LeaguePlaceholderTab } from './LeaguePlaceholderTab';
import { LeagueTopScorers } from './LeagueTopScorers';
import { RoundSelector } from './RoundSelector';
import { LeagueFixturesContent } from './LeagueFixturesContent';

const TOPBAR_BASE_H = 60;
const LEAGUE_TABS: readonly LeagueSubTabId[] = ['tafla', 'leikir', 'leikmenn', 'lid', 'timabil'];

interface Props {
  leagueId: number;
}

export function LeagueDetailScreen({ leagueId }: Props) {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const topBarH = insets.top + TOPBAR_BASE_H;
  const tint = theme === 'dark' ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight';

  const { data: league } = useLeagueMeta(leagueId);
  const currentSeasonId = league?.currentseason?.id ?? league?.currentSeason?.id ?? league?.current_season_id ?? null;
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const activeSeasonId = selectedSeasonId ?? currentSeasonId;

  const { data: standingGroups = [], isLoading: standingsLoading } = useLeagueStandingsGrouped(activeSeasonId);

  const { data: topScorers = [], isLoading: scorersLoading } = useQuery({
    queryKey: ['league-top-scorers', activeSeasonId],
    queryFn: () => fetchTopScorers(activeSeasonId!),
    staleTime: 5 * 60 * 1000,
    enabled: activeSeasonId != null,
  });

  const {
    rounds,
    selectedRoundId,
    setSelectedRoundId,
    fixtures,
    roundsLoading,
    fixturesLoading,
    roundsError,
    fixturesError,
    refetchRounds,
    refetchFixtures,
  } = useLeagueFixtures(activeSeasonId);

  const selectedRound = useMemo(
    () => rounds.find((r) => r.id === selectedRoundId),
    [rounds, selectedRoundId]
  );

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const { data: todayFixtures = [] } = useFixturesByDate(today);
  const liveTeamIds = useMemo(
    () => getLiveTeamIds(todayFixtures, leagueId),
    [todayFixtures, leagueId]
  );

  const [activeTab, setActiveTab] = useState<LeagueSubTabId>('tafla');
  const [viewMode, setViewMode] = useState<ViewMode>('tafla');
  const [seasonDropdownOpen, setSeasonDropdownOpen] = useState(false);
  const [leagueHeaderHeight, setLeagueHeaderHeight] = useState(80);

  const scrollViewRef = useRef<ScrollView>(null);

  // Panel animations — useNativeDriver: false so setValue in useEffect is
  // batched with React tree updates (no race condition / flash on commit).
  const currentPanelX = useRef(new Animated.Value(0)).current;
  const prevPanelX = useRef(new Animated.Value(-screenWidth)).current;
  const nextPanelX = useRef(new Animated.Value(screenWidth)).current;
  const currentPanelOpacity = useRef(new Animated.Value(1)).current;
  const screenWidthRef = useRef(screenWidth);
  const activeTabRef = useRef(activeTab);
  const prevTabIdRef = useRef<LeagueSubTabId | null>(null);
  const nextTabIdRef = useRef<LeagueSubTabId | null>(null);
  const isCommittingRef = useRef(false);
  const [frozenPrevTab, setFrozenPrevTab] = useState<LeagueSubTabId | null>(null);
  const [frozenNextTab, setFrozenNextTab] = useState<LeagueSubTabId | null>(null);

  // Total height of the fixed header overlay (topbar + league header + subtabs)
  const totalHeaderH = topBarH + leagueHeaderHeight + SUBTABS_HEIGHT;

  // Compute flanking tabs and keep refs in sync for PanResponder closure
  const currentTabIdx = LEAGUE_TABS.indexOf(activeTab);
  const prevTabId: LeagueSubTabId | null = currentTabIdx > 0 ? LEAGUE_TABS[currentTabIdx - 1] : null;
  const nextTabId: LeagueSubTabId | null = currentTabIdx < LEAGUE_TABS.length - 1 ? LEAGUE_TABS[currentTabIdx + 1] : null;
  prevTabIdRef.current = prevTabId;
  nextTabIdRef.current = nextTabId;
  screenWidthRef.current = screenWidth;
  activeTabRef.current = activeTab;

  const leagueInfo = LEAGUES[leagueId as keyof typeof LEAGUES];
  const leagueName = leagueInfo?.displayName ?? league?.name ?? '';

  const activeSeasonYear = useMemo(() => {
    const seasons = league?.seasons ?? [];
    const season = seasons.find((s) => s.id === activeSeasonId) ?? league?.currentseason ?? league?.currentSeason;
    const match = season?.name?.match(/\d{4}/);
    return match ? match[0] : '';
  }, [league, activeSeasonId]);

  const subLine = useMemo(() => {
    const seasons = league?.seasons ?? [];
    const season = seasons.find((s) => s.id === activeSeasonId) ?? league?.currentseason ?? league?.currentSeason;
    if (!season) return '';
    if (season.finished) return 'Lokið';
    return activeSeasonYear ? `${activeSeasonYear}` : '';
  }, [league, activeSeasonId, activeSeasonYear]);

  const gradStart = theme === 'dark' ? '#0b120f' : '#ecf5f0';
  const gradEnd = colors.bg;

  // After setActiveTab commits: snap panels to resting positions.
  // useEffect (fires after paint) + useNativeDriver: false ensures setValue
  // is processed in the same UIManager batch as React tree updates — no flash.
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
            scrollViewRef.current?.scrollTo({ y: 0, animated: false });
            setFrozenNextTab(nextTabIdRef.current);
            currentPanelOpacity.setValue(0);
            isCommittingRef.current = true;
            const idx = LEAGUE_TABS.indexOf(activeTabRef.current);
            if (idx + 1 < LEAGUE_TABS.length) setActiveTab(LEAGUE_TABS[idx + 1]);
          });
        } else {
          nextPanelX.setValue(sw);
          Animated.parallel([
            Animated.timing(currentPanelX, { toValue: sw, duration: 220, useNativeDriver: false }),
            Animated.timing(prevPanelX, { toValue: 0, duration: 220, useNativeDriver: false }),
          ]).start(() => {
            scrollViewRef.current?.scrollTo({ y: 0, animated: false });
            setFrozenPrevTab(prevTabIdRef.current);
            currentPanelOpacity.setValue(0);
            isCommittingRef.current = true;
            const idx = LEAGUE_TABS.indexOf(activeTabRef.current);
            if (idx - 1 >= 0) setActiveTab(LEAGUE_TABS[idx - 1]);
          });
        }
      } else {
        springBack();
      }
    },
    onPanResponderTerminate: () => springBack(),
  })).current;

  const renderTabContent = (tabId: LeagueSubTabId) => {
    switch (tabId) {
      case 'tafla':
        return (
          <>
            <ViewToggle mode={viewMode} onChange={setViewMode} />
            {standingsLoading ? (
              <View style={styles.loading}>
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>Sæki töflu…</Text>
              </View>
            ) : standingGroups.length === 0 ? (
              <View style={styles.loading}>
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>Engar niðurstöður</Text>
              </View>
            ) : (
              standingGroups.map((group) => {
                let zoneRules: Record<number, 'promotion' | 'playoff' | 'relegation'> | undefined;
                let zoneLabels: ZoneLabels | undefined;
                if (group.type === 'championship') {
                  zoneRules = EFRI_HLUTI_ZONE_RULES[leagueId] ?? {};
                  zoneLabels = EFRI_HLUTI_ZONE_LABELS[leagueId];
                } else if (group.type === 'relegation') {
                  zoneRules = NEDRI_HLUTI_ZONE_RULES[leagueId] ?? {};
                  zoneLabels = NEDRI_HLUTI_ZONE_LABELS[leagueId];
                }
                return (
                  <View key={`${group.label || 'main'}-${group.stageId ?? 0}`}>
                    {group.label ? (
                      <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionHeaderText, { color: colors.textMuted }]}>
                          {group.label}
                        </Text>
                      </View>
                    ) : null}
                    <StandingsTable
                      rows={group.rows}
                      mode={viewMode}
                      leagueId={leagueId}
                      liveTeamIds={liveTeamIds}
                      zoneRules={zoneRules}
                      zoneLabels={zoneLabels}
                    />
                  </View>
                );
              })
            )}
          </>
        );
      case 'leikir':
        return (
          <>
            <RoundSelector
              rounds={rounds}
              selectedRoundId={selectedRoundId}
              onSelect={setSelectedRoundId}
              isLoading={roundsLoading}
            />
            <LeagueFixturesContent
              fixtures={fixtures}
              selectedRound={selectedRound}
              roundsLoading={roundsLoading}
              fixturesLoading={fixturesLoading}
              roundsError={roundsError}
              fixturesError={fixturesError}
              onRetryRounds={refetchRounds}
              onRetryFixtures={refetchFixtures}
            />
          </>
        );
      case 'leikmenn':
        return scorersLoading ? (
          <View style={styles.loading}>
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Sæki markahæsta…</Text>
          </View>
        ) : (
          <LeagueTopScorers scorers={topScorers} />
        );
      default:
        return <LeaguePlaceholderTab />;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} {...panResponder.panHandlers}>
      {/* Previous tab panel — off-screen left */}
      {(frozenPrevTab ?? prevTabId) && (
        <Animated.View
          style={[StyleSheet.absoluteFill, { transform: [{ translateX: prevPanelX }] }]}
          pointerEvents="none"
        >
          <View style={{ paddingTop: totalHeaderH }}>
            {renderTabContent((frozenPrevTab ?? prevTabId)!)}
          </View>
        </Animated.View>
      )}

      {/* Next tab panel — off-screen right */}
      {(frozenNextTab ?? nextTabId) && (
        <Animated.View
          style={[StyleSheet.absoluteFill, { transform: [{ translateX: nextPanelX }] }]}
          pointerEvents="none"
        >
          <View style={{ paddingTop: totalHeaderH }}>
            {renderTabContent((frozenNextTab ?? nextTabId)!)}
          </View>
        </Animated.View>
      )}

      {/* Current tab — interactive ScrollView */}
      <Animated.View style={{ flex: 1, transform: [{ translateX: currentPanelX }], opacity: currentPanelOpacity }}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{ paddingTop: totalHeaderH, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
        >
          {renderTabContent(activeTab)}
        </ScrollView>
      </Animated.View>

      {/* Fixed header overlay — league header + subtabs sit above panels */}
      <View
        style={{ position: 'absolute', top: topBarH, left: 0, right: 0 }}
        pointerEvents="box-none"
      >
        <View
          style={[styles.leagueHeader, { backgroundColor: colors.bg }]}
          onLayout={(e) => setLeagueHeaderHeight(e.nativeEvent.layout.height)}
          pointerEvents="none"
        >
          <View style={[styles.leagueLogo, { backgroundColor: colors.surfaceSunken, borderColor: colors.border }]}>
            {LOCAL_LEAGUE_IMAGES[leagueId] ? (
              <Image
                source={LOCAL_LEAGUE_IMAGES[leagueId]}
                style={styles.leagueLogoImg}
                resizeMode="contain"
              />
            ) : league?.image_path ? (
              <Image
                source={{ uri: league.image_path }}
                style={styles.leagueLogoImg}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.leagueLogoFallback} />
            )}
          </View>
          <View style={styles.leagueMeta}>
            <Text style={[styles.leagueName, { color: colors.text }]}>{leagueName}</Text>
            {subLine ? (
              <Text style={[styles.leagueSub, { color: colors.textMuted }]}>{subLine}</Text>
            ) : null}
          </View>
        </View>
        <View style={{ backgroundColor: colors.bg }} pointerEvents="auto">
          <LeagueSubTabs active={activeTab} onChange={setActiveTab} />
        </View>
      </View>

      {/* Top bar — back button + season selector */}
      <View style={[styles.topbar, { top: 0 }]} pointerEvents="box-none">
        <BlurView
          intensity={80}
          tint={tint}
          style={[styles.topbarBlur, { paddingTop: insets.top + 10 }]}
        >
          <LinearGradient
            colors={[gradStart, gradEnd]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            pointerEvents="none"
          />
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            style={[styles.iconBtn, { backgroundColor: `rgba(${colors.bgRgb}, 0.55)`, borderColor: colors.border }]}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>

          <View style={{ flex: 1 }} />

          <View style={styles.topbarActions} pointerEvents="auto">
            {activeSeasonYear ? (
              <TouchableOpacity
                onPress={() => setSeasonDropdownOpen(true)}
                activeOpacity={0.7}
                style={[styles.seasonPill, { backgroundColor: `rgba(${colors.bgRgb}, 0.55)`, borderColor: colors.border }]}
              >
                <Text style={[styles.seasonPillText, { color: colors.text }]}>{activeSeasonYear}</Text>
                <Ionicons name="chevron-down" size={12} color={colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>
        </BlurView>
      </View>

      <SeasonDropdown
        visible={seasonDropdownOpen}
        seasons={league?.seasons ?? []}
        currentSeasonId={currentSeasonId}
        selectedSeasonId={activeSeasonId}
        onSelect={(id) => setSelectedSeasonId(id)}
        onClose={() => setSeasonDropdownOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topbar: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 50,
  },
  topbarBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 10,
  },
  topbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  seasonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  seasonPillText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
  },
  leagueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 14,
  },
  leagueLogo: {
    width: 56,
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    flexShrink: 0,
  },
  leagueLogoImg: {
    width: '100%',
    height: '100%',
  },
  leagueLogoFallback: {
    flex: 1,
    backgroundColor: '#02529c',
    margin: 4,
    borderRadius: 9,
  },
  leagueMeta: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  leagueName: {
    fontFamily: 'BricolageGrotesque_800ExtraBold',
    fontSize: 22,
    letterSpacing: -0.55,
    lineHeight: 26,
  },
  leagueSub: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
    letterSpacing: 0.2,
  },
  loading: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 15,
  },
  sectionHeader: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 6,
  },
  sectionHeaderText: {
    fontFamily: 'BricolageGrotesque_700Bold',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
