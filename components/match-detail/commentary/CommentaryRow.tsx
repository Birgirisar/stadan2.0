import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { CommentaryEntry } from '../../../lib/api/types';
import { useTheme } from '../../../lib/theme/useTheme';

interface Props {
  item: CommentaryEntry;
  isLast: boolean;
}

/**
 * Pre-computed goal-row tint backgrounds (CSS color-mix equivalents).
 *
 * Dark:  color-mix(in srgb, #2dd47e 12%, #14171c) → #172e28
 * Light: color-mix(in srgb, #d8efe2 50%, #ffffff)  → #ebf7f1
 */
const GOAL_BG_DARK = '#172e28';
const GOAL_BG_LIGHT = '#ebf7f1';

// ── Icon detection ─────────────────────────────────────────────────────────────

type IconKind = 'goal' | 'yellow' | 'red' | 'yellow-red' | null;

/**
 * Determine which icon (if any) to show for a commentary entry.
 *
 * `is_goal` is the primary signal for goals, but Sportmonks sometimes sets it
 * false for entries like "Gunnar takes a shot and scores." — so we fall back to
 * text detection. Card detection is always text-based since `is_important` is
 * unreliable (observed false on confirmed yellow-card entries).
 *
 * Text patterns are checked after `is_goal` so a genuine goal entry can never
 * accidentally become a card.
 */
function detectIcon(item: CommentaryEntry): IconKind {
  if (item.is_goal) return 'goal';

  const lower = item.comment.toLowerCase();

  // Goal text fallback — only when is_important:true.
  // Sportmonks sometimes sets is_goal:false on real goals (e.g. "X scores with
  // a left-footed shot.") but those entries reliably carry is_important:true.
  // Requiring it blocks false positives from bad-data echoes where the same
  // "scores" text appears with is_goal:false AND is_important:false.
  if (
    item.is_important &&
    /\bscores\b/.test(lower) &&
    !/substitut|replac|\bis on\b|\bis off\b/.test(lower)
  ) {
    return 'goal';
  }

  // Cards — order matters: check yellow-red before yellow
  if (/second yellow|yellow.red|double yellow/.test(lower)) return 'yellow-red';
  if (/yellow card/.test(lower)) return 'yellow';
  if (/red card|sent off|is sent|receives a red/.test(lower)) return 'red';

  return null;
}

// ── Icon components (matching Yfirlit EventRow exactly) ────────────────────────

function GoalIcon({ color }: { color: string }) {
  return <Ionicons name="football" size={15} color={color} />;
}

function CardRect({ color, style }: { color: string; style?: object }) {
  return <View style={[styles.card, { backgroundColor: color }, style]} />;
}

function RowIcon({ kind, colors }: { kind: IconKind; colors: any }) {
  if (!kind) return null;
  switch (kind) {
    case 'goal':
      return <GoalIcon color={colors.accent} />;
    case 'yellow':
      return <CardRect color="#f5c518" />;
    case 'red':
      return <CardRect color="#d63031" />;
    case 'yellow-red':
      return (
        <View style={styles.doubleCard}>
          <CardRect color="#f5c518" style={{ zIndex: 1 }} />
          <CardRect color="#d63031" style={styles.redOverlap} />
        </View>
      );
  }
}

// ── Minute pill ────────────────────────────────────────────────────────────────

function formatMinutePill(item: CommentaryEntry): string {
  if (item.minute == null) return '';
  if (item.extra_minute != null) return `${item.minute}+${item.extra_minute}'`;
  return `${item.minute}'`;
}

// ── Row ────────────────────────────────────────────────────────────────────────

export const CommentaryRow = memo(function CommentaryRow({ item, isLast }: Props) {
  const { colors, theme } = useTheme();

  const isDark = theme === 'dark';
  const minuteStr = formatMinutePill(item);
  const iconKind = detectIcon(item);
  const isGoal = iconKind === 'goal';
  const isImportant = item.is_important && !isGoal;

  const rowBg = isGoal
    ? (isDark ? GOAL_BG_DARK : GOAL_BG_LIGHT)
    : colors.surface;

  const fontFamily = isGoal
    ? 'Manrope_700Bold'
    : isImportant
    ? 'Manrope_600SemiBold'
    : 'Manrope_500Medium';

  return (
    <View
      style={[
        styles.row,
        { backgroundColor: rowBg },
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
    >
      {/* Minute pill */}
      <View
        style={[
          styles.minutePill,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.minuteText, { color: colors.text }]}>{minuteStr}</Text>
      </View>

      {/* Comment text */}
      <Text style={[styles.commentText, { color: colors.text, fontFamily }]}>
        {item.comment}
      </Text>

      {/* Event icon — goal football, yellow/red card */}
      <View style={styles.iconSlot}>
        <RowIcon kind={iconKind} colors={colors} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  minutePill: {
    width: 44,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  minuteText: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 11.5,
  },
  commentText: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 19,
  },
  // Fixed-width slot so the text column doesn't shift when there's no icon
  iconSlot: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
    flexShrink: 0,
  },
  // Card icons — exact dimensions from EventRow.tsx
  card: {
    width: 11,
    height: 14,
    borderRadius: 2,
  },
  doubleCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  redOverlap: {
    marginLeft: -7,
    marginTop: -4,
    zIndex: 10,
    elevation: 10,
  },
});
