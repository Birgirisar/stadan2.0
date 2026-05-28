import { Ionicons } from '@expo/vector-icons';
import * as Application from 'expo-application';
import { BlurView } from 'expo-blur';
import * as Clipboard from 'expo-clipboard';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import * as StoreReview from 'expo-store-review';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../lib/theme/useTheme';
import { useThemePreference } from '../lib/hooks/useThemePreference';
import type { ThemeColors } from '../lib/theme/colors';

// TODO: replace with real contact email before shipping
const CONTACT_EMAIL = 'stadan@example.com';

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

// ── NotificationsSheet ────────────────────────────────────────────────────────

function NotificationsSheet({
  visible,
  onClose,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  colors: ThemeColors;
}) {
  const translateY = useRef(new Animated.Value(400)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  function handleClose() {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 400,
        duration: 220,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose}>
          <Animated.View
            style={[
              styles.sheet,
              { backgroundColor: colors.surface, transform: [{ translateY }] },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <Pressable onPress={handleClose} style={styles.grabberArea}>
              <View style={[styles.grabber, { backgroundColor: colors.borderStrong }]} />
            </Pressable>
            <View style={styles.sheetContent}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>
                Tilkynningar koma fljótlega
              </Text>
              <Text style={[styles.sheetBody, { color: colors.textSecondary }]}>
                Þegar þú fylgist með lið eða deild færðu tilkynningar um leiki, mörk og úrslit.
              </Text>
            </View>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </Modal>
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

  const [notifSheetVisible, setNotifSheetVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(msg);
    setToastVisible(true);
    toastTimer.current = setTimeout(() => setToastVisible(false), 2500);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message:
          'Staðan — íslenskt fótboltaapp. Niðurstöður, töflur og lýsingar á íslensku.',
        url: 'https://stadan.app',
      });
    } catch {}
  };

  const handleRate = async () => {
    try {
      const isAvailable = await StoreReview.isAvailableAsync();
      if (isAvailable) {
        await StoreReview.requestReview();
      } else {
        showToast('Kemur þegar appið birtist í App Store');
      }
    } catch {
      showToast('Kemur þegar appið birtist í App Store');
    }
  };

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
          <TouchableOpacity onPress={() => setNotifSheetVisible(true)} activeOpacity={0.7}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Ionicons name="notifications-outline" size={18} color={colors.textSecondary} />
                <Text style={[styles.rowLabel, { color: colors.text }]}>Tilkynningar</Text>
              </View>
              <View style={styles.rowRight}>
                <View style={[styles.comingSoonPill, { backgroundColor: colors.goldSoft }]}>
                  <Text style={[styles.comingSoonText, { color: colors.gold }]}>
                    KEMUR FLJÓTLEGA
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>

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
                {' · English coming later'}
              </Text>
            </View>
          </View>
        </View>

        {/* DEILA */}
        <SectionHeader label="DEILA" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity onPress={handleShare} activeOpacity={0.7}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Ionicons name="share-social-outline" size={18} color={colors.textSecondary} />
                <Text style={[styles.rowLabel, { color: colors.text }]}>Meta appið vinum</Text>
              </View>
              <View style={styles.rowRight}>
                <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleRate} activeOpacity={0.7}>
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
          </TouchableOpacity>

          <TouchableOpacity onPress={handleContact} activeOpacity={0.7}>
            <View style={[styles.row, { borderTopWidth: 1, borderTopColor: colors.border }]}>
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

          <View style={[styles.row, { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <View style={styles.rowLeft}>
              <Ionicons name="heart-outline" size={18} color={colors.textSecondary} />
              <Text style={[styles.rowLabel, { color: colors.text }]}>Útbúið með</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={[styles.rowValue, { color: colors.textMuted }]}>
                umhyggju á Íslandi
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

      <NotificationsSheet
        visible={notifSheetVisible}
        onClose={() => setNotifSheetVisible(false)}
        colors={colors}
      />

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
  comingSoonPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  comingSoonText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  // Bottom sheet
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 20,
  },
  grabberArea: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 8,
  },
  grabber: {
    width: 38,
    height: 4,
    borderRadius: 999,
  },
  sheetContent: {
    paddingHorizontal: 24,
    paddingTop: 4,
    gap: 12,
  },
  sheetTitle: {
    fontFamily: 'BricolageGrotesque_700Bold',
    fontSize: 20,
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  sheetBody: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 15,
    lineHeight: 22,
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
