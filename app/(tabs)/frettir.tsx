import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/theme/useTheme';

export default function FrettirScreen() {
  const { colors, theme, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const tint = theme === 'dark' ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight';
  const gradStart = theme === 'dark' ? '#0b120f' : '#ecf5f0';
  const gradEnd = colors.bg;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Fréttir</Text>
        <Text style={[styles.sub, { color: colors.textMuted }]}>kemur fljótlega</Text>
      </View>

      {/* Frosted header — absolutely positioned */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }} pointerEvents="box-none">
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
                onPress={() => router.push('/stillingar' as any)}
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'BricolageGrotesque_800ExtraBold',
    fontSize: 32,
    letterSpacing: -0.8,
  },
  sub: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 15,
    marginTop: 8,
  },
});
