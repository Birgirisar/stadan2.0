import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../lib/theme/useTheme';
import { isSameDay } from '../../lib/utils/dates';

const MONTH_NAMES = [
  'Janúar', 'Febrúar', 'Mars', 'Apríl', 'Maí', 'Júní',
  'Júlí', 'Ágúst', 'September', 'Október', 'Nóvember', 'Desember',
];

const DAY_LABELS = ['Mán', 'Þri', 'Mið', 'Fim', 'Fös', 'Lau', 'Sun'];

const CELL = 40;
const COLS = 7;

interface Props {
  visible: boolean;
  selectedDate: Date;
  today: Date;
  viewYear: number;
  viewMonth: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelect: (date: Date) => void;
  onClose: () => void;
}

function buildGrid(year: number, month: number): (Date | null)[] {
  const firstDow = new Date(year, month, 1).getDay();
  const startOffset = (firstDow + 6) % 7; // Monday-based
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = Array(startOffset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % COLS !== 0) cells.push(null);
  return cells;
}

export function DatePickerModal({
  visible, selectedDate, today,
  viewYear, viewMonth, onPrevMonth, onNextMonth,
  onSelect, onClose,
}: Props) {
  const { colors } = useTheme();
  const grid = buildGrid(viewYear, viewMonth);

  function pick(date: Date) {
    onSelect(date);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header: month/year title + close button */}
          <View style={styles.monthNav}>
            <Text style={[styles.monthTitle, { color: colors.text }]}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            {DAY_LABELS.map((d) => (
              <View key={d} style={styles.cell}>
                <Text style={[styles.dayHeader, { color: colors.textMuted }]}>{d}</Text>
              </View>
            ))}
          </View>

          <View style={styles.grid}>
            {grid.map((date, i) => {
              if (!date) return <View key={`e-${i}`} style={styles.cell} />;
              const isSelected = isSameDay(date, selectedDate);
              const isToday = isSameDay(date, today);
              return (
                <TouchableOpacity
                  key={date.getTime()}
                  style={[
                    styles.cell,
                    isSelected && [styles.selectedCell, { backgroundColor: colors.text }],
                    !isSelected && isToday && [styles.todayCell, { borderColor: colors.accent }],
                  ]}
                  onPress={() => pick(date)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.dayNum,
                    { color: isSelected ? colors.bg : isToday ? colors.accent : colors.text },
                  ]}>
                    {date.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Footer: prev arrow — Í dag — next arrow */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity onPress={onPrevMonth} style={styles.navBtn} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => pick(today)} style={styles.todayBtn} activeOpacity={0.7}>
              <Text style={[styles.todayBtnText, { color: colors.accent }]}>Í dag</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onNextMonth} style={styles.navBtn} activeOpacity={0.7}>
              <Ionicons name="chevron-forward" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheet: {
    width: CELL * COLS + 40,
    borderRadius: 20,
    borderWidth: 1,
    paddingTop: 16,
    overflow: 'hidden',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  monthTitle: {
    fontFamily: 'BricolageGrotesque_700Bold',
    fontSize: 16,
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
  },
  navBtn: {
    flex: 1,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  cell: {
    width: CELL,
    height: CELL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCell: {
    borderRadius: 12,
  },
  todayCell: {
    borderRadius: 12,
    borderWidth: 1,
  },
  dayHeader: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  dayNum: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
  },
  todayBtn: {
    flex: 1,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayBtnText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    letterSpacing: 0.2,
  },
});
