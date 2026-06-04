import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState, useMemo } from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/theme/useTheme';
import { useQuery } from '@tanstack/react-query';
import { useLeagueMeta, useLeagueStandings } from '../../lib/hooks/useLeagueDetail';
import { fetchTopScorers } from '../../lib/api/teamDetail';
import { useFixturesByDate } from '../../lib/api/fixtures';
import { useLeagueFixtures } from '../../lib/hooks/useLeagueFixtures';
import { getLiveTeamIds } from '../../lib/utils/liveTeams';
import { LEAGUES } from '../../constants/leagues';
import { LeagueSubTabs, type LeagueSubTabId } from './LeagueSubTabs';
import { ViewToggle, type ViewMode } from './ViewToggle';
import { StandingsTable } from './StandingsTable';
import { SeasonDropdown } from './SeasonDropdown';
import { LeaguePlaceholderTab } from './LeaguePlaceholderTab';
import { LeagueTopScorers } from './LeagueTopScorers';
import { RoundSelector } from './RoundSelector';
import { LeagueFixturesContent } from './LeagueFixturesContent';

const TOPBAR_BASE_H = 60;

interface Props {
  leagueId: number;
}

export function LeagueDetailScreen({ leagueId }: Props) {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();

  const topBarH = insets.top + TOPBAR_BASE_H;
  const tint = theme === 'dark' ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight';

  const { data: league } = useLeagueMeta(leagueId);
  const currentSeasonId = league?.currentseason?.id ?? league?.currentSeason?.id ?? league?.current_season_id ?? null;
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const activeSeasonId = selectedSeasonId ?? currentSeasonId;

  const { data: standingRows = [], isLoading: standingsLoading } = useLeagueStandings(activeSeasonId);

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

  const scrollY = useRef(new Animated.Value(0)).current;
  const [leagueHeaderHeight, setLeagueHeaderHeight] = useState(80);

  const titleOpacity = scrollY.interpolate({
    inputRange: [leagueHeaderHeight - 60, leagueHeaderHeight],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const titleTranslateY = scrollY.interpolate({
    inputRange: [leagueHeaderHeight - 60, leagueHeaderHeight],
    outputRange: [6, 0],
    extrapolate: 'clamp',
  });

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

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: topBarH, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        stickyHeaderIndices={[1]}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
      >
        <View
          style={styles.leagueHeader}
          onLayout={(e) => setLeagueHeaderHeight(e.nativeEvent.layout.height)}
        >
          <View style={[styles.leagueLogo, { backgroundColor: colors.surfaceSunken, borderColor: colors.border }]}>
            {league?.image_path ? (
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

        <View style={{ backgroundColor: colors.bg }}>
          <LeagueSubTabs active={activeTab} onChange={setActiveTab} />
          {activeTab === 'leikir' && (
            <RoundSelector
              rounds={rounds}
              selectedRoundId={selectedRoundId}
              onSelect={setSelectedRoundId}
              isLoading={roundsLoading}
            />
          )}
          {activeTab === 'tafla' && (
            <ViewToggle mode={viewMode} onChange={setViewMode} />
          )}
        </View>

        <View>
          {activeTab === 'tafla' ? (
            standingsLoading ? (
              <View style={styles.loading}>
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>Sæki töflu…</Text>
              </View>
            ) : standingRows.length === 0 ? (
              <View style={styles.loading}>
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>Engar niðurstöður</Text>
              </View>
            ) : (
              <StandingsTable
                rows={standingRows}
                mode={viewMode}
                leagueId={leagueId}
                liveTeamIds={liveTeamIds}
              />
            )
          ) : activeTab === 'leikir' ? (
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
          ) : activeTab === 'leikmenn' ? (
            scorersLoading ? (
              <View style={styles.loading}>
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>Sæki markahæsta…</Text>
              </View>
            ) : (
              <LeagueTopScorers scorers={topScorers} />
            )
          ) : (
            <LeaguePlaceholderTab />
          )}
        </View>
      </Animated.ScrollView>

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

          <Animated.Text
            style={[
              styles.topbarTitle,
              { color: colors.text, opacity: titleOpacity, transform: [{ translateY: titleTranslateY }] },
            ]}
            numberOfLines={1}
          >
            {leagueName}
          </Animated.Text>

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
  topbarTitle: {
    flex: 1,
    fontFamily: 'BricolageGrotesque_800ExtraBold',
    fontSize: 15,
    letterSpacing: -0.3,
    textAlign: 'center',
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
});
