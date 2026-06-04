import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../lib/theme/useTheme';
import { getDayLabel, getWeekDays, isSameDay } from '../../lib/utils/dates';

const PILL_W = 64;
const PILL_GAP = 10;
const PILL_STEP = PILL_W + PILL_GAP;
const SPREAD = 7;
const PAD_H = 2;

interface Props {
  selectedDate: Date;
  today: Date;
  onSelect: (date: Date) => void;
}

export function DaySelector({ selectedDate, today, onSelect }: Props) {
  const { colors } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const [viewWidth, setViewWidth] = useState(Dimensions.get('window').width);

  // 15 days always centered on selectedDate
  const days = getWeekDays(selectedDate, SPREAD);

  useEffect(() => {
    // Center the selected day (always at index SPREAD = 7)
    const pillCenter = PAD_H + SPREAD * PILL_STEP + PILL_W / 2;
    const x = Math.max(0, pillCenter - viewWidth / 2);
    scrollRef.current?.scrollTo({ x, animated: false });
  }, [selectedDate, viewWidth]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      onLayout={(e) => setViewWidth(e.nativeEvent.layout.width)}
    >
      {days.map((day, i) => {
        const isToday = isSameDay(day, today);
        const isSelected = isSameDay(day, selectedDate);
        const label = getDayLabel(day, isToday);

        return (
          <TouchableOpacity
            key={i}
            onPress={() => onSelect(day)}
            style={[
              styles.pill,
              isSelected && { backgroundColor: colors.text },
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.dayLabel,
                isToday && styles.dayLabelToday,
                {
                  color: isSelected
                    ? colors.bg
                    : isToday
                    ? colors.accent
                    : colors.textMuted,
                  opacity: isSelected ? 0.7 : 1,
                },
              ]}
            >
              {label}
            </Text>
            <Text
              style={[
                styles.dayNumber,
                { color: isSelected ? colors.bg : colors.text },
              ]}
            >
              {day.getDate()}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: PAD_H,
    paddingVertical: 4,
    gap: PILL_GAP,
    flexDirection: 'row',
  },
  pill: {
    minWidth: PILL_W,
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: 14,
    alignItems: 'center',
    gap: 2,
  },
  dayLabel: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 10.5,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  dayLabelToday: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12,
    letterSpacing: 0.2,
  },
  dayNumber: {
    fontFamily: 'BricolageGrotesque_700Bold',
    fontSize: 19,
    lineHeight: 23,
  },
});
