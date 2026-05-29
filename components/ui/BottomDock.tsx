import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/theme/useTheme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: Array<{ href: string; label: string; icon: IoniconName }> = [
  { href: '/', label: 'Leikir', icon: 'football' },
  { href: '/mot', label: 'Mót', icon: 'trophy-outline' },
  { href: '/frettir', label: 'Fréttir', icon: 'newspaper-outline' },
];

export function BottomDock() {
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();

  // Search is a focused full-screen task — no dock needed there.
  if (pathname === '/leit') return null;

  const tint = theme === 'dark' ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight';

  const isActive = (href: string) =>
    href === '/'
      ? pathname === '/' || pathname === '' || pathname === '/(tabs)'
      : pathname.startsWith(href);

  return (
    <View
      style={[styles.wrapper, { bottom: insets.bottom }]}
      pointerEvents="box-none"
    >
      {/* Tab capsule */}
      <View
        style={[
          styles.capsuleShadow,
          { flex: 1, shadowColor: theme === 'dark' ? '#000' : '#0e1014' },
        ]}
      >
        <BlurView
          intensity={85}
          tint={tint}
          style={[styles.tabCapsule, { borderColor: colors.border }]}
        >
          {TABS.map((tab) => {
            const active = isActive(tab.href);
            return (
              <TouchableOpacity
                key={tab.href}
                onPress={() => router.navigate(tab.href as any)}
                style={styles.tab}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={tab.icon}
                  size={22}
                  color={active ? colors.accent : colors.textMuted}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: active ? colors.text : colors.textMuted },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </BlurView>
      </View>

      {/* Search pill */}
      <View
        style={[
          styles.capsuleShadow,
          { shadowColor: theme === 'dark' ? '#000' : '#0e1014' },
        ]}
      >
        <BlurView
          intensity={85}
          tint={tint}
          style={[styles.searchPill, { borderColor: colors.border }]}
        >
          <TouchableOpacity
            style={styles.searchBtn}
            activeOpacity={0.7}
            onPress={() => router.push('/leit' as any)}
          >
            <Ionicons name="search-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 14,
    right: 14,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'stretch',
  },
  capsuleShadow: {
    borderRadius: 26,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 12,
  },
  tabCapsule: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 2,
  },
  tabLabel: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 10,
    letterSpacing: 0.1,
  },
  searchPill: {
    flex: 1,
    width: 58,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1,
  },
  searchBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
});
