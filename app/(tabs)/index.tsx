import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LEAGUES } from '../../constants/leagues';
import { useFixturesByDate } from '../../lib/api/fixtures';
import type { Fixture } from '../../lib/api/types';
import { useTheme } from '../../lib/theme/useTheme';
import { getSectionHeading, toDateString } from '../../lib/utils/dates';
import { DaySelector } from '../../components/fixtures/DaySelector';
import { FilterChips, FilterType } from '../../components/fixtures/FilterChips';
import { LeagueSection } from '../../components/fixtures/LeagueSection';

function groupAndSort(fixtures: Fixture[]) {
  const map: Record<number, Fixture[]> = {};
  for (const f of fixtures) {
    if (!map[f.league_id]) map[f.league_id] = [];
    map[f.league_id].push(f);
  }
  return Object.entries(map)
    .map(([id, fxs]) => ({
      leagueId: Number(id),
      fixtures: fxs,
      roundName: fxs[0]?.round?.name,
    }))
    .sort((a, b) => {
      const ao = LEAGUES[a.leagueId as keyof typeof LEAGUES]?.sortOrder ?? 99;
      const bo = LEAGUES[b.leagueId as keyof typeof LEAGUES]?.sortOrder ?? 99;
      return ao - bo;
    });
}

export default function LeikirScreen() {
  const { colors, theme, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [headerHeight, setHeaderHeight] = useState(insets.top + 130);

  // Ref so PanResponder closure always has the latest date without being recreated
  const shiftDay = useRef<(delta: number) => void>(() => {});
  useEffect(() => {
    shiftDay.current = (delta: number) => {
      setSelectedDate((prev) => {
        const next = new Date(prev);
        next.setDate(next.getDate() + delta);
        return next;
      });
    };
  }, []);

  // True while a touch is active inside any horizontal scroll area — suppresses date-shift swipe
  const horizontalScrollActive = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      // Only claim the gesture when horizontal movement clearly dominates and
      // the user is NOT swiping on a horizontal scroll area (DaySelector, FilterChips)
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        !horizontalScrollActive.current &&
        Math.abs(dx) > Math.abs(dy) * 1.5 && Math.abs(dx) > 12,
      onPanResponderRelease: (_, { dx }) => {
        if (dx < -100) shiftDay.current(1);
        else if (dx > 100) shiftDay.current(-1);
      },
    })
  ).current;

  const { data: fixtures = [], isLoading, isFetching, error, refetch } = useFixturesByDate(selectedDate);

  const tint = theme === 'dark' ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight';

  const allGroups = useMemo(() => groupAndSort(fixtures), [fixtures]);
  const hasLive = fixtures.some((f) => f.state?.is_live);

  const filteredGroups = useMemo(() => {
    if (activeFilter === 'live') return allGroups.filter((g) => g.fixtures.some((f) => f.state?.is_live));
    if (activeFilter === 'male') return allGroups.filter((g) => [345, 348, 351].includes(g.leagueId));
    if (activeFilter === 'female') return allGroups.filter((g) => [1710, 1711].includes(g.leagueId));
    return allGroups;
  }, [allGroups, activeFilter]);

  const totalCount = filteredGroups.reduce((sum, g) => sum + g.fixtures.length, 0);
  const sectionLabel = getSectionHeading(selectedDate);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} {...panResponder.panHandlers}>
      {/* Scrollable content — starts padded by headerHeight */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: headerHeight, paddingBottom: insets.bottom + 88 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            tintColor={colors.text}
            colors={[colors.text]}
            progressViewOffset={headerHeight}
          />
        }
      >
        <View
          onTouchStart={() => { horizontalScrollActive.current = true; }}
          onTouchEnd={() => { horizontalScrollActive.current = false; }}
          onTouchCancel={() => { horizontalScrollActive.current = false; }}
        >
          <FilterChips active={activeFilter} onSelect={setActiveFilter} hasLive={hasLive} />
        </View>

        {!isLoading && !error && (
          <View style={[styles.sectionRow, { paddingHorizontal: 22 }]}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              {sectionLabel}
            </Text>
            <View
              style={[
                styles.countBadge,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.countText, { color: colors.textMuted }]}>
                {totalCount} leikir
              </Text>
            </View>
          </View>
        )}

        {isLoading && (
          <View style={styles.center}>
            <Text style={[styles.msgText, { color: colors.textMuted }]}>Sæki leiki…</Text>
          </View>
        )}

        {!!error && !isLoading && (
          <View style={styles.center}>
            <Text style={[styles.msgText, { color: colors.textMuted }]}>
              Villa við að sækja leiki
            </Text>
            <TouchableOpacity
              onPress={() => refetch()}
              style={[styles.retryBtn, { borderColor: colors.border }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.retryText, { color: colors.accent }]}>Reyna aftur</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isLoading && !error && filteredGroups.length === 0 && (
          <View style={styles.center}>
            <Text style={[styles.msgText, { color: colors.textMuted }]}>
              {activeFilter === 'live' ? 'Engir leikir í beinni' : 'Engir leikir í dag'}
            </Text>
          </View>
        )}

        {filteredGroups.map((g) => (
          <LeagueSection
            key={`${g.leagueId}-${toDateString(selectedDate)}`}
            leagueId={g.leagueId}
            fixtures={g.fixtures}
            roundName={g.roundName}
          />
        ))}
      </ScrollView>

      {/* Absolutely-positioned frosted header */}
      <View
        style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
        pointerEvents="box-none"
      >
        <BlurView
          intensity={80}
          tint={tint}
          style={{
            paddingTop: insets.top + 6,
            paddingHorizontal: 18,
            paddingBottom: 12,
          }}
        >
          <View style={styles.headerTop}>
            <Text style={[styles.appTitle, { color: colors.text }]}>
              Staðan<Text style={{ color: colors.accent }}>.</Text>
            </Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={toggleTheme}
                style={[
                  styles.iconBtn,
                  {
                    backgroundColor: `rgba(${colors.bgRgb}, 0.6)`,
                    borderColor: colors.border,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={theme === 'dark' ? 'sunny-outline' : 'moon-outline'}
                  size={18}
                  color={colors.text}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.iconBtn,
                  {
                    backgroundColor: `rgba(${colors.bgRgb}, 0.6)`,
                    borderColor: colors.border,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Ionicons name="settings-outline" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <View
            onTouchStart={() => { horizontalScrollActive.current = true; }}
            onTouchEnd={() => { horizontalScrollActive.current = false; }}
            onTouchCancel={() => { horizontalScrollActive.current = false; }}
          >
            <DaySelector
              selectedDate={selectedDate}
              today={today}
              onSelect={setSelectedDate}
            />
          </View>
        </BlurView>

        <LinearGradient
          colors={[`rgba(${colors.bgRgb}, 0.5)`, `rgba(${colors.bgRgb}, 0)`]}
          style={{ height: 20 }}
          pointerEvents="none"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  appTitle: {
    fontFamily: 'BricolageGrotesque_800ExtraBold',
    fontSize: 28,
    letterSpacing: -0.7,
    lineHeight: 32,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 6,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  sectionTitle: {
    fontFamily: 'BricolageGrotesque_700Bold',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  countText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
  },
  center: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 12,
  },
  msgText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 15,
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  retryText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
  },
});
