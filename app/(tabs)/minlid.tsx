import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Swipeable } from 'react-native-gesture-handler';
import React, { useRef } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TeamBadge } from '../../components/fixtures/TeamBadge';
import { useFollowedTeams } from '../../lib/hooks/useFollowedTeams';
import { useSearchableEntities } from '../../lib/hooks/useSearchableEntities';
import type { SearchableTeam } from '../../lib/hooks/useSearchableEntities';
import { useTheme } from '../../lib/theme/useTheme';

function TeamRow({
  team,
  onUnfollow,
  onPress,
}: {
  team: SearchableTeam;
  onUnfollow: () => void;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const swipeRef = useRef<Swipeable>(null);
  const touchStartX = useRef(0);
  const didSwipe = useRef(false);

  const renderRightActions = () => (
    <TouchableOpacity
      style={[styles.swipeAction, { backgroundColor: colors.live }]}
      activeOpacity={0.85}
      onPress={() => {
        swipeRef.current?.close();
        onUnfollow();
      }}
    >
      <Ionicons name="star-outline" size={18} color="#fff" />
      <Text style={styles.swipeText}>Hætta að{'\n'}fylgja</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.cardWrapper}>
      <Swipeable
        ref={swipeRef}
        renderRightActions={renderRightActions}
        overshootRight={false}
        friction={2}
        rightThreshold={60}
      >
        <View
          onTouchStart={(e) => {
            touchStartX.current = e.nativeEvent.pageX;
            didSwipe.current = false;
          }}
          onTouchMove={(e) => {
            if (Math.abs(e.nativeEvent.pageX - touchStartX.current) > 5) {
              didSwipe.current = true;
            }
          }}
        >
        <TouchableOpacity
          activeOpacity={0.82}
          onPress={() => { if (!didSwipe.current) onPress(); }}
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <TeamBadge
            imageUrl={team.image_path}
            shortCode={team.short_code}
            size={44}
            teamId={team.id}
          />
          <View style={styles.info}>
            <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={1}>
              {team.name}
            </Text>
            <Text style={[styles.leagueName, { color: colors.textMuted }]} numberOfLines={1}>
              {team.league_name}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>
        </View>
      </Swipeable>
    </View>
  );
}

export default function MinLidScreen() {
  const { colors, theme, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { followedIds, toggle, loaded } = useFollowedTeams();
  const { teams, isLoading } = useSearchableEntities();

  const tint = theme === 'dark' ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight';
  const gradStart = theme === 'dark' ? '#0b120f' : '#ecf5f0';
  const gradEnd = colors.bg;

  const followedSet = new Set(followedIds);
  const followedTeams = teams
    .filter((t) => followedSet.has(t.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'is'));

  const showLoading = !loaded || (isLoading && followedTeams.length === 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: insets.top + 80, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.pageTitle, { color: colors.text }]}>Mín lið</Text>

        {showLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : followedTeams.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconWrap, { backgroundColor: colors.goldSoft }]}>
              <Ionicons name="star" size={30} color={colors.gold} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Engin lið í mínum lið
            </Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>
              Farðu á síðu liðs og smelltu á stjörnu til að fylgjast með
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.sectionHeading}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                Þú fylgist með
              </Text>
              <View
                style={[
                  styles.countBadge,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.countText, { color: colors.textMuted }]}>
                  {followedTeams.length} lið
                </Text>
              </View>
            </View>

            <Text style={[styles.hint, { color: colors.textMuted }]}>
              Dragðu til vinstri á liði til að hætta að fylgja því
            </Text>

            {followedTeams.map((team) => (
              <TeamRow
                key={team.id}
                team={team}
                onUnfollow={() => toggle(team.id)}
                onPress={() =>
                  router.push({ pathname: '/team/[id]' as any, params: { id: team.id } })
                }
              />
            ))}
          </>
        )}
      </ScrollView>

      {/* Frosted header — absolutely positioned */}
      <View
        style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}
        pointerEvents="box-none"
      >
        <BlurView
          intensity={80}
          tint={tint}
          style={{ paddingTop: insets.top + 6, paddingHorizontal: 18, paddingBottom: 14 }}
        >
          <LinearGradient
            colors={[gradStart, gradEnd]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            pointerEvents="none"
          />
          <View style={styles.headerTop}>
            <Text style={[styles.appTitle, { color: colors.text }]}>
              Staðan<Text style={{ color: colors.accent }}>.</Text>
            </Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={toggleTheme}
                style={[
                  styles.iconBtn,
                  { backgroundColor: `rgba(${colors.bgRgb}, 0.6)`, borderColor: colors.border },
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
                onPress={() => router.push('/stillingar' as any)}
                style={[
                  styles.iconBtn,
                  { backgroundColor: `rgba(${colors.bgRgb}, 0.6)`, borderColor: colors.border },
                ]}
                activeOpacity={0.7}
              >
                <Ionicons name="settings-outline" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  pageTitle: {
    fontFamily: 'BricolageGrotesque_800ExtraBold',
    fontSize: 22,
    letterSpacing: -0.45,
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 6,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontFamily: 'BricolageGrotesque_700Bold',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.78,
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
  loading: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyState: {
    paddingTop: 60,
    paddingHorizontal: 40,
    alignItems: 'center',
    gap: 14,
  },
  emptyIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: 'BricolageGrotesque_700Bold',
    fontSize: 18,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  emptySub: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  cardWrapper: {
    marginHorizontal: 14,
    marginBottom: 10,
    borderRadius: 18,
    overflow: 'hidden',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 14,
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  teamName: {
    fontFamily: 'BricolageGrotesque_700Bold',
    fontSize: 16,
    letterSpacing: -0.25,
    lineHeight: 19,
  },
  leagueName: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
  },
  swipeAction: {
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  swipeText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 15,
  },
  hint: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 22,
    paddingBottom: 12,
  },
});
