import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../lib/theme/useTheme';
import { useLeagueDirectory } from '../../../lib/hooks/useLeagueDirectory';
import { useFollowedLeagues } from '../../../lib/hooks/useFollowedLeagues';
import { LeagueCard } from '../../../components/mot/LeagueCard';
import { FollowedSection } from '../../../components/mot/FollowedSection';

export default function MotDirectoryScreen() {
  const { colors, theme, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { summaries, isLoading } = useLeagueDirectory();
  const { followedIds, isFollowed } = useFollowedLeagues();

  const tint = theme === 'dark' ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight';

  const handleLeaguePress = (leagueId: number) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push({ pathname: '/mot/[leagueId]' as any, params: { leagueId } });
  };

  const gradStart = theme === 'dark' ? '#0b120f' : '#ecf5f0';
  const gradEnd = colors.bg;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: insets.top + 80, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Page title */}
        <Text style={[styles.pageTitle, { color: colors.text }]}>Mót</Text>

        {/* Followed section */}
        <FollowedSection
          summaries={summaries}
          followedIds={followedIds}
          onPress={handleLeaguePress}
        />

        {/* All leagues section */}
        <View style={styles.sectionHeading}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Allar deildir</Text>
        </View>

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : (
          summaries.map((s) => (
            <LeagueCard
              key={s.leagueId}
              summary={s}
              isFollowed={isFollowed(s.leagueId)}
              onPress={() => handleLeaguePress(s.leagueId)}
            />
          ))
        )}
      </ScrollView>

      {/* Frosted header — absolutely positioned */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }} pointerEvents="box-none">
        <BlurView
          intensity={80}
          tint={tint}
          style={{ paddingTop: insets.top + 6, paddingHorizontal: 18, paddingBottom: 14 }}
        >
          {/* Background gradient — must stay first child so it renders behind everything */}
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
                style={[styles.iconBtn, { backgroundColor: `rgba(${colors.bgRgb}, 0.6)`, borderColor: colors.border }]}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={theme === 'dark' ? 'sunny-outline' : 'moon-outline'}
                  size={18}
                  color={colors.text}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: `rgba(${colors.bgRgb}, 0.6)`, borderColor: colors.border }]}
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
  loading: {
    paddingVertical: 40,
    alignItems: 'center',
  },
});
