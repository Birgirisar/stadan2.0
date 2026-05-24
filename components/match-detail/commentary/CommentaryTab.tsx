import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { CommentaryEntry } from '../../../lib/api/types';
import { useCommentary } from '../../../lib/hooks/useCommentary';
import { useTheme } from '../../../lib/theme/useTheme';
import { detectPeriodMarker } from '../../../lib/utils/commentary';
import { CommentaryEmpty } from './CommentaryEmpty';
import { CommentaryRow } from './CommentaryRow';
import { PeriodDivider } from './PeriodDivider';

// ── Skeleton ───────────────────────────────────────────────────

const SKELETON_WIDTHS = ['72%', '55%', '85%', '60%', '78%'] as const;

function SkeletonPulse({ children }: { children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
}

function SkeletonRow({ textWidth, colors }: { textWidth: string; colors: any }) {
  return (
    <View style={[styles.skeletonRow, { borderBottomColor: colors.border }]}>
      <SkeletonPulse>
        <View style={[styles.skeletonPill, { backgroundColor: colors.surfaceSunken }]} />
      </SkeletonPulse>
      <SkeletonPulse>
        <View
          style={[styles.skeletonText, { backgroundColor: colors.surfaceSunken, width: textWidth as any }]}
        />
      </SkeletonPulse>
    </View>
  );
}

// ── Error banner ───────────────────────────────────────────────

function ErrorBanner({ onRetry, colors }: { onRetry: () => void; colors: any }) {
  return (
    <View style={[styles.errorRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.errorText, { color: colors.textMuted }]}>
        Ekki tókst að sækja lýsingu
      </Text>
      <Pressable
        onPress={onRetry}
        style={[styles.retryBtn, { borderColor: colors.border }]}
      >
        <Text style={[styles.retryText, { color: colors.text }]}>Reyna aftur</Text>
      </Pressable>
    </View>
  );
}

// ── Rendered list item ─────────────────────────────────────────

type ListItem =
  | { kind: 'divider'; label: string; key: string }
  | { kind: 'row'; entry: CommentaryEntry };

function buildListItems(entries: CommentaryEntry[]): ListItem[] {
  return entries.map((entry) => {
    const { kind, label } = detectPeriodMarker(entry.comment);
    if (kind !== null && label !== null) {
      return { kind: 'divider', label, key: `divider-${entry.id}` };
    }
    return { kind: 'row', entry };
  });
}

// ── Main tab ───────────────────────────────────────────────────

interface Props {
  fixtureId: number;
  isLive: boolean;
}

export function CommentaryTab({ fixtureId, isLive }: Props) {
  const { colors } = useTheme();
  const { data, isLoading, error, refetch } = useCommentary(fixtureId, isLive);

  const cardStyle = [styles.card, { backgroundColor: colors.surface, borderColor: colors.border }];

  // Loading skeleton
  if (isLoading) {
    return (
      <View style={styles.wrapper}>
        <View style={cardStyle}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Lýsing</Text>
          </View>
          {SKELETON_WIDTHS.map((w, i) => (
            <SkeletonRow key={i} textWidth={w} colors={colors} />
          ))}
        </View>
      </View>
    );
  }

  const items = data ? buildListItems(data) : [];
  const rowItems = items.filter((i): i is Extract<ListItem, { kind: 'row' }> => i.kind === 'row');

  return (
    <View style={styles.wrapper}>
      <View style={cardStyle}>
        {/* Section title */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Lýsing</Text>
        </View>

        {/* Error banner — shown above list, doesn't blow away content */}
        {error && <ErrorBanner onRetry={refetch} colors={colors} />}

        {/* Empty state */}
        {!error && items.length === 0 && <CommentaryEmpty />}

        {/* Commentary list */}
        {items.length > 0 &&
          items.map((item, idx) => {
            if (item.kind === 'divider') {
              return <PeriodDivider key={item.key} label={item.label} />;
            }
            // is it the last *row* item? Check if no more row items follow
            const remainingRows = rowItems.indexOf(item as Extract<ListItem, { kind: 'row' }>);
            const isLast = remainingRows === rowItems.length - 1;
            return (
              <CommentaryRow
                key={item.entry.id}
                item={item.entry}
                isLast={isLast || idx === items.length - 1}
              />
            );
          })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 14,
    paddingTop: 16,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontFamily: 'BricolageGrotesque_700Bold',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  // Skeleton styles
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
  },
  skeletonPill: {
    width: 44,
    height: 30,
    borderRadius: 15,
  },
  skeletonText: {
    height: 13,
    borderRadius: 6,
  },
  // Error
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 12,
  },
  errorText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    flex: 1,
  },
  retryBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  retryText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
  },
});
