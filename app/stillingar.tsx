import { Ionicons } from '@expo/vector-icons';
import * as Application from 'expo-application';
import { BlurView } from 'expo-blur';
import * as Clipboard from 'expo-clipboard';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
// import * as StoreReview from 'expo-store-review';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  AppState,
  Pressable,
  ScrollView,
  // Share,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFollowedTeams } from '../lib/hooks/useFollowedTeams';
import { useNotificationPreference } from '../lib/hooks/useNotificationPreference';
import {
  disableNotifications,
  enableNotifications,
  getNotificationPermissionStatus,
  registerForPushNotificationsAsync,
} from '../lib/notifications';
import { useTheme } from '../lib/theme/useTheme';
import { useThemePreference } from '../lib/hooks/useThemePreference';
import type { ThemeColors } from '../lib/theme/colors';

const CONTACT_EMAIL = 'stadanapp@gmail.com';

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, visible }: { message: string; visible: boolean }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: visible ? 180 : 280,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  return (
    <Animated.View style={[styles.toast, { opacity }]} pointerEvents="none">
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
}

// ── SectionHeader ─────────────────────────────────────────────────────────────

function SectionHeader({
  label,
  first,
  colors,
}: {
  label: string;
  first?: boolean;
  colors: ThemeColors;
}) {
  return (
    <Text
      style={[
        styles.sectionHeader,
        { color: colors.textMuted, marginTop: first ? 8 : 24 },
      ]}
    >
      {label}
    </Text>
  );
}

// ── ThemeSegment ──────────────────────────────────────────────────────────────

function ThemeSegment({
  preference,
  setPreference,
  colors,
}: {
  preference: 'dark' | 'light';
  setPreference: (t: 'dark' | 'light') => void;
  colors: ThemeColors;
}) {
  const thumbAnim = useRef(new Animated.Value(preference === 'light' ? 1 : 0)).current;
  const [halfWidth, setHalfWidth] = useState(0);

  // Sync animation when preference changes externally (e.g. on AsyncStorage load)
  useEffect(() => {
    Animated.spring(thumbAnim, {
      toValue: preference === 'light' ? 1 : 0,
      useNativeDriver: true,
      bounciness: 0,
      speed: 24,
    }).start();
  }, [preference]);

  const setPref = (next: 'dark' | 'light') => {
    setPreference(next);
    Animated.spring(thumbAnim, {
      toValue: next === 'light' ? 1 : 0,
      useNativeDriver: true,
      bounciness: 4,
      speed: 20,
    }).start();
  };

  return (
    <View
      style={[styles.segContainer, { backgroundColor: colors.surfaceSunken }]}
      onLayout={(e) => setHalfWidth(e.nativeEvent.layout.width / 2)}
    >
      <Animated.View
        style={[
          styles.segThumb,
          {
            backgroundColor: colors.surface,
            width: halfWidth > 0 ? halfWidth - 3 : '50%' as any,
            transform: [
              {
                translateX: thumbAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, halfWidth],
                }),
              },
            ],
          },
        ]}
      />
      <TouchableOpacity onPress={() => setPref('dark')} activeOpacity={0.7} style={styles.segOption}>
        <Text style={[styles.segText, { color: preference === 'dark' ? colors.text : colors.textMuted }]}>
          Dökkt
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setPref('light')} activeOpacity={0.7} style={styles.segOption}>
        <Text style={[styles.segText, { color: preference === 'light' ? colors.text : colors.textMuted }]}>
          Ljóst
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function StillingarScreen() {
  const { colors, theme } = useTheme();
  const { preference, setPreference } = useThemePreference();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const tint = theme === 'dark' ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight';

  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // TODO: dev-only push token test — remove once the real notifications feature ships
  const [devPushToken, setDevPushToken] = useState<string | null>(null);
  const [devPushLoading, setDevPushLoading] = useState(false);

  const { followedIds } = useFollowedTeams();
  const { enabled: notificationsEnabled, setEnabled: setNotificationsEnabled } = useNotificationPreference();
  const [osPermissionDenied, setOsPermissionDenied] = useState(false);
  const [notifBusy, setNotifBusy] = useState(false);

  const showToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(msg);
    setToastVisible(true);
    toastTimer.current = setTimeout(() => setToastVisible(false), 2500);
  };

  // Permission can change from iOS Settings while the app is backgrounded,
  // so recheck whenever the app comes back to the foreground, not just on mount.
  useEffect(() => {
    const checkPermission = () => {
      getNotificationPermissionStatus().then((status) => setOsPermissionDenied(status === 'denied'));
    };
    checkPermission();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkPermission();
    });
    return () => sub.remove();
  }, []);

  const handleToggleNotifications = async (value: boolean) => {
    setNotifBusy(true);
    try {
      if (value) {
        const result = await enableNotifications(followedIds);
        if (result.status === 'granted') {
          setNotificationsEnabled(true);
          setOsPermissionDenied(false);
          showToast('Tilkynningar kveiktar');
        } else if (result.status === 'denied') {
          setOsPermissionDenied(true);
          showToast('Leyfi hafnað fyrir tilkynningar');
        } else {
          showToast('Virkar ekki í hermi — prófaðu á alvöru síma');
        }
      } else {
        setNotificationsEnabled(false);
        await disableNotifications();
        showToast('Tilkynningar slökktar');
      }
    } finally {
      setNotifBusy(false);
    }
  };

  // const handleShare = async () => {
  //   try {
  //     await Share.share({
  //       message:
  //         'Staðan — íslenskt fótboltaapp. Niðurstöður, töflur og lýsingar á íslensku.',
  //       url: 'https://stadan.app',
  //     });
  //   } catch {}
  // };

  // const handleRate = async () => {
  //   try {
  //     const isAvailable = await StoreReview.isAvailableAsync();
  //     if (isAvailable) {
  //       await StoreReview.requestReview();
  //     } else {
  //       showToast('Kemur þegar appið birtist í App Store');
  //     }
  //   } catch {
  //     showToast('Kemur þegar appið birtist í App Store');
  //   }
  // };

  const handleContact = async () => {
    // TODO: replace CONTACT_EMAIL with the real address before shipping
    const mailto = `mailto:${CONTACT_EMAIL}?subject=Sta%C3%B0an%20%E2%80%94%20%C3%81bending&body=`;
    const canOpen = await Linking.canOpenURL(mailto).catch(() => false);
    if (canOpen) {
      Linking.openURL(mailto);
    } else {
      try {
        await Clipboard.setStringAsync(CONTACT_EMAIL);
        showToast('Netfang afritað');
      } catch {
        showToast('Netfang afritað');
      }
    }
  };

  // TODO: dev-only push token test — remove once the real notifications feature ships
  const handleTestPush = async () => {
    setDevPushLoading(true);
    setDevPushToken(null);
    try {
      const result = await registerForPushNotificationsAsync();
      if (result.status === 'granted') {
        setDevPushToken(result.token);
      } else if (result.status === 'denied') {
        showToast('Leyfi fyrir tilkynningar hafnað');
      } else {
        showToast('Virkar ekki í hermi — prófaðu á alvöru síma');
      }
    } catch {
      showToast('Eitthvað fór úrskeiðis');
    } finally {
      setDevPushLoading(false);
    }
  };

  const handleCopyDevToken = async () => {
    if (!devPushToken) return;
    await Clipboard.setStringAsync(devPushToken);
    showToast('Token afritað');
  };

  const nativeVersion = Application.nativeApplicationVersion;
  const nativeBuild = Application.nativeBuildVersion;
  const version = nativeVersion ?? Constants.expoConfig?.version ?? '—';
  const build = nativeBuild ?? '—';

  // Top bar height: paddingTop + min content height + paddingBottom
  const TOP_BAR_H = insets.top + 2 + 44 + 12;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: TOP_BAR_H + 4,
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ÚTLIT */}
        <SectionHeader label="ÚTLIT" first colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.row, { alignItems: 'center' }]}>
            <View style={styles.rowLeft}>
              <Ionicons name="color-palette-outline" size={18} color={colors.textSecondary} />
              <Text style={[styles.rowLabel, { color: colors.text }]}>Þema</Text>
            </View>
            <ThemeSegment
              preference={preference}
              setPreference={setPreference}
              colors={colors}
            />
          </View>
        </View>

        {/* TILKYNNINGAR */}
        <SectionHeader label="TILKYNNINGAR" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="notifications-outline" size={18} color={colors.textSecondary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, { color: colors.text }]}>Tilkynningar</Text>
                <Text style={[styles.rowHint, { color: colors.textMuted }]} numberOfLines={2}>
                  {osPermissionDenied
                    ? 'Leyfi vantar — kveiktu í stillingum símans'
                    : 'Tilkynning þegar liðin þín skora eða leik lýkur'}
                </Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              disabled={notifBusy}
              trackColor={{ false: colors.surfaceSunken, true: colors.accent }}
              ios_backgroundColor={colors.surfaceSunken}
            />
          </View>
        </View>

        {/* DEV ONLY — TODO: remove this whole section once real push notifications ship */}
        {__DEV__ && (
          <>
            <SectionHeader label="PRÓFUN (DEV)" colors={colors} />
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TouchableOpacity onPress={handleTestPush} activeOpacity={0.7} disabled={devPushLoading}>
                <View style={styles.row}>
                  <View style={styles.rowLeft}>
                    <Ionicons name="flask-outline" size={18} color={colors.textSecondary} />
                    <Text style={[styles.rowLabel, { color: colors.text }]}>Prófa tilkynningar</Text>
                  </View>
                  <View style={styles.rowRight}>
                    <Text style={[styles.rowValue, { color: colors.textSecondary }]}>
                      {devPushLoading ? 'Sæki token…' : 'Keyra'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
              {devPushToken && (
                <TouchableOpacity
                  onPress={handleCopyDevToken}
                  activeOpacity={0.7}
                  style={[styles.devTokenBox, { borderTopColor: colors.border }]}
                >
                  <Text style={[styles.devTokenText, { color: colors.textSecondary }]} selectable>
                    {devPushToken}
                  </Text>
                  <Text style={[styles.devTokenHint, { color: colors.textMuted }]}>
                    Ýttu til að afrita — límdu inn á expo.dev/notifications
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {/* TUNGUMÁL */}
        <SectionHeader label="TUNGUMÁL" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="language-outline" size={18} color={colors.textSecondary} />
              <Text style={[styles.rowLabel, { color: colors.text }]}>Tungumál</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={[styles.rowValue, { color: colors.textSecondary }]}>Íslenska</Text>
              <Text style={[styles.rowValueMuted, { color: colors.textMuted }]}>
                {' · English coming soon'}
              </Text>
            </View>
          </View>
        </View>

        {/* DEILA */}
        <SectionHeader label="DEILA" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* <TouchableOpacity onPress={handleShare} activeOpacity={0.7}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Ionicons name="share-social-outline" size={18} color={colors.textSecondary} />
                <Text style={[styles.rowLabel, { color: colors.text }]}>Deila appinu með vinum</Text>
              </View>
              <View style={styles.rowRight}>
                <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
              </View>
            </View>
          </TouchableOpacity> */}

          {/* <TouchableOpacity onPress={handleRate} activeOpacity={0.7}>
            <View style={[styles.row, { borderTopWidth: 1, borderTopColor: colors.border }]}>
              <View style={styles.rowLeft}>
                <Ionicons name="star-outline" size={18} color={colors.textSecondary} />
                <Text style={[styles.rowLabel, { color: colors.text }]}>
                  Gefa einkunn í App Store
                </Text>
              </View>
              <View style={styles.rowRight}>
                <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
              </View>
            </View>
          </TouchableOpacity> */}

          <TouchableOpacity onPress={handleContact} activeOpacity={0.7}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Ionicons name="mail-outline" size={18} color={colors.textSecondary} />
                <Text style={[styles.rowLabel, { color: colors.text }]}>Hafa samband</Text>
              </View>
              <View style={styles.rowRight}>
                <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* UM APPIÐ */}
        <SectionHeader label="UM APPIÐ" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
              <Text style={[styles.rowLabel, { color: colors.text }]}>Útgáfa</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={[styles.versionText, { color: colors.textMuted }]}>
                {version} ({build})
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fixed frosted top bar */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
        <BlurView
          intensity={80}
          tint={tint}
          style={{ paddingTop: insets.top + 2, paddingBottom: 12, paddingHorizontal: 14 }}
        >
          <View style={styles.topBar}>
            <Pressable
              onPress={() => router.back()}
              style={[
                styles.roundBtn,
                { backgroundColor: colors.surface + '80', borderColor: colors.border },
              ]}
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>
            <Text style={[styles.screenTitle, { color: colors.text }]}>Stillingar</Text>
            <View style={styles.roundBtnSpacer} />
          </View>
        </BlurView>
      </View>

      <Toast message={toastMessage} visible={toastVisible} />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundBtnSpacer: {
    width: 44,
  },
  screenTitle: {
    fontFamily: 'BricolageGrotesque_700Bold',
    fontSize: 17,
    letterSpacing: -0.3,
  },
  sectionHeader: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 10.5,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 6,
    marginLeft: 4,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    minWidth: 0,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    maxWidth: '55%' as any,
  },
  rowLabel: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
  },
  rowValue: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
  },
  rowValueMuted: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
  },
  versionText: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 13,
  },
  devTokenBox: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
  },
  devTokenText: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 12,
  },
  devTokenHint: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 11,
  },
  rowHint: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 11,
    marginTop: 2,
  },
  // Segmented control
  segContainer: {
    borderRadius: 9,
    padding: 3,
    flexDirection: 'row',
    position: 'relative',
    overflow: 'hidden',
    flexShrink: 0,
  },
  segThumb: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    left: 3,
    borderRadius: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segOption: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    alignItems: 'center',
    zIndex: 2,
  },
  segText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12.5,
  },
  // Toast
  toast: {
    position: 'absolute',
    bottom: 108,
    alignSelf: 'center',
    backgroundColor: 'rgba(20, 23, 28, 0.92)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
  },
  toastText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
    color: '#f1f2f4',
  },
});
