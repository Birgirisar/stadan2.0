import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import React, { useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SearchResultRow } from '../components/search/SearchResultRow';
import { DIRECTORY_LEAGUE_IDS } from '../constants/leagues';
import { useSearchableEntities } from '../lib/hooks/useSearchableEntities';
import { useTheme } from '../lib/theme/useTheme';
import { filterAndRank } from '../lib/utils/search';

export default function LeitScreen() {
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');

  const tint = theme === 'dark' ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight';
  const { leagues, teams, isLoading, error } = useSearchableEntities();

  const filteredLeagues = useMemo(
    () => (query ? filterAndRank(query, leagues) : leagues),
    [query, leagues]
  );
  const filteredTeams = useMemo(
    () => (query ? filterAndRank(query, teams).slice(0, 20) : []),
    [query, teams]
  );

  const hasQuery = query.trim().length > 0;
  const hasResults = filteredLeagues.length > 0 || filteredTeams.length > 0;
  const showSkeleton = hasQuery && isLoading && teams.length === 0;
  const showError = !isLoading && !!error && teams.length === 0;
  const showNoResults = hasQuery && !isLoading && !showError && !hasResults;
  const showResults = hasQuery && !showSkeleton && !showError && hasResults;

  const TOP_BAR_H = insets.top + 2 + 44 + 12;

  function handleBack() {
    Keyboard.dismiss();
    router.back();
  }

  function handleClear() {
    setQuery('');
    inputRef.current?.focus();
  }

  function handleRetry() {
    DIRECTORY_LEAGUE_IDS.forEach((id) => {
      queryClient.invalidateQueries({ queryKey: ['league', id] });
    });
    queryClient.invalidateQueries({ queryKey: ['searchable-teams'] });
  }

  function handleLeaguePress(id: number) {
    Keyboard.dismiss();
    router.push({ pathname: '/mot/[leagueId]' as any, params: { leagueId: id } });
  }

  function handleTeamPress(id: number) {
    Keyboard.dismiss();
    router.push({ pathname: '/team/[id]' as any, params: { id } });
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingTop: TOP_BAR_H + 8,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: 16,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Empty query — "Vinsælt" + all leagues */}
        {!hasQuery && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Vinsælt</Text>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {leagues.map((league, i) => (
                <SearchResultRow
                  key={league.id}
                  type="league"
                  id={league.id}
                  name={league.name}
                  subtitle="Deild"
                  imagePath={league.image_path}
                  isLast={i === leagues.length - 1}
                  onPress={() => handleLeaguePress(league.id)}
                />
              ))}
            </View>
          </>
        )}

        {/* Loading skeleton — first fetch while user has typed something */}
        {showSkeleton && <SkeletonRows colors={colors} />}

        {/* Error state */}
        {showError && <ErrorState colors={colors} onRetry={handleRetry} />}

        {/* No results */}
        {showNoResults && <NoResultsState query={query} colors={colors} />}

        {/* Results — grouped by type */}
        {showResults && (
          <>
            {filteredLeagues.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Deildir</Text>
                <View
                  style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  {filteredLeagues.map((league, i) => (
                    <SearchResultRow
                      key={league.id}
                      type="league"
                      id={league.id}
                      name={league.name}
                      subtitle="Deild"
                      imagePath={league.image_path}
                      isLast={i === filteredLeagues.length - 1}
                      onPress={() => handleLeaguePress(league.id)}
                    />
                  ))}
                </View>
              </>
            )}

            {filteredTeams.length > 0 && (
              <>
                <Text
                  style={[
                    styles.sectionLabel,
                    { color: colors.textSecondary, marginTop: filteredLeagues.length > 0 ? 20 : 0 },
                  ]}
                >
                  Lið
                </Text>
                <View
                  style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  {filteredTeams.map((team, i) => (
                    <SearchResultRow
                      key={team.id}
                      type="team"
                      id={team.id}
                      name={team.name}
                      subtitle={team.league_name}
                      imagePath={team.image_path}
                      isLast={i === filteredTeams.length - 1}
                      onPress={() => handleTeamPress(team.id)}
                    />
                  ))}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Frosted top bar — back button + search input */}
      <View style={styles.topBarWrapper}>
        <BlurView
          intensity={80}
          tint={tint}
          style={{ paddingTop: insets.top + 2, paddingBottom: 12, paddingHorizontal: 14 }}
        >
          <View style={styles.topBar}>
            <Pressable
              onPress={handleBack}
              style={[
                styles.roundBtn,
                { backgroundColor: colors.surface + '80', borderColor: colors.border },
              ]}
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>

            <View
              style={[
                styles.inputWrap,
                { backgroundColor: colors.surface + '8C', borderColor: colors.border },
              ]}
            >
              <TextInput
                ref={inputRef}
                style={[styles.input, { color: colors.text }]}
                placeholder="Leita að liði eða deild"
                placeholderTextColor={colors.textMuted}
                value={query}
                onChangeText={setQuery}
                autoFocus
                returnKeyType="search"
                onSubmitEditing={() => Keyboard.dismiss()}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={handleClear} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </BlurView>
      </View>
    </View>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SkeletonRows({ colors }: { colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.skeletonRow,
            i < 4 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
          ]}
        >
          <View style={[styles.skeletonCircle, { backgroundColor: colors.surfaceElev }]} />
          <View style={styles.skeletonText}>
            <View style={[styles.skeletonLine, { backgroundColor: colors.surfaceElev, width: '55%' }]} />
            <View
              style={[
                styles.skeletonLine,
                { backgroundColor: colors.surfaceElev, width: '32%', marginTop: 6 },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

function NoResultsState({
  query,
  colors,
}: {
  query: string;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={[styles.stateCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Ionicons name="search-outline" size={32} color={colors.textMuted} style={{ marginBottom: 10 }} />
      <Text style={[styles.stateTitle, { color: colors.text }]}>
        Ekkert fannst fyrir „{query}"
      </Text>
      <Text style={[styles.stateSubtitle, { color: colors.textMuted }]}>
        Prófaðu aðra stafsetningu eða farðu í Mót-flipann til að finna deildir.
      </Text>
    </View>
  );
}

function ErrorState({
  colors,
  onRetry,
}: {
  colors: ReturnType<typeof useTheme>['colors'];
  onRetry: () => void;
}) {
  return (
    <View style={[styles.stateCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Ionicons name="alert-circle-outline" size={32} color={colors.textMuted} style={{ marginBottom: 10 }} />
      <Text style={[styles.stateTitle, { color: colors.text }]}>Villa við að sækja gögn</Text>
      <TouchableOpacity
        onPress={onRetry}
        style={[styles.retryBtn, { backgroundColor: colors.accentSoft, borderColor: colors.accent + '40' }]}
        activeOpacity={0.7}
      >
        <Text style={[styles.retryText, { color: colors.accent }]}>Reyna aftur</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  topBarWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
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
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
    gap: 6,
  },
  input: {
    flex: 1,
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    padding: 0,
  },
  sectionLabel: {
    fontFamily: 'BricolageGrotesque_600SemiBold',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginLeft: 4,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  skeletonCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    flexShrink: 0,
  },
  skeletonText: {
    flex: 1,
  },
  skeletonLine: {
    height: 10,
    borderRadius: 6,
  },
  stateCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
  },
  stateTitle: {
    fontFamily: 'BricolageGrotesque_800ExtraBold',
    fontSize: 15,
    letterSpacing: -0.2,
    textAlign: 'center',
    marginBottom: 8,
  },
  stateSubtitle: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  retryText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
  },
});
