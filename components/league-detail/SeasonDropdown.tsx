import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Season } from '../../lib/api/types';
import { useTheme } from '../../lib/theme/useTheme';

interface Props {
  visible: boolean;
  seasons: Season[];
  currentSeasonId: number | null;
  selectedSeasonId: number | null;
  onSelect: (seasonId: number) => void;
  onClose: () => void;
}

function seasonLabel(season: Season): string {
  const match = season.name?.match(/\d{4}/);
  return match ? match[0] : season.name ?? '—';
}

export function SeasonDropdown({
  visible,
  seasons,
  currentSeasonId,
  selectedSeasonId,
  onSelect,
  onClose,
}: Props) {
  const { colors } = useTheme();

  const sorted = [...seasons].sort((a, b) => {
    const ya = parseInt(a.name?.match(/\d{4}/)?.[0] ?? '0', 10);
    const yb = parseInt(b.name?.match(/\d{4}/)?.[0] ?? '0', 10);
    return yb - ya;
  });

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View
        style={[
          styles.dropdown,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderStrong,
            shadowColor: colors.text,
          },
        ]}
      >
        <View
          style={[
            styles.header,
            { backgroundColor: colors.surfaceSunken, borderBottomColor: colors.border },
          ]}
        >
          <Text style={[styles.headerText, { color: colors.textMuted }]}>Tímabil</Text>
        </View>

        {sorted.map((season) => {
          const isCurrent = season.id === currentSeasonId;
          const isSelected = season.id === selectedSeasonId;
          const label = seasonLabel(season);

          return (
            <TouchableOpacity
              key={season.id}
              onPress={() => {
                onSelect(season.id);
                onClose();
              }}
              activeOpacity={0.7}
              style={[
                styles.option,
                { borderBottomColor: colors.border },
              ]}
            >
              <Text
                style={[
                  styles.optionYear,
                  { color: isSelected ? colors.accent : colors.text },
                  isSelected && styles.optionYearSelected,
                ]}
              >
                {label}
              </Text>
              {isCurrent && (
                <View style={[styles.badge, { backgroundColor: colors.accentSoft }]}>
                  <Text style={[styles.badgeText, { color: colors.accent }]}>Núverandi</Text>
                </View>
              )}
              {isSelected && !isCurrent && (
                <Text style={[styles.check, { color: colors.accent }]}>✓</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    inset: 0,
  },
  dropdown: {
    position: 'absolute',
    top: 96,
    right: 14,
    minWidth: 180,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    elevation: 12,
  },
  header: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionYear: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
  },
  optionYearSelected: {
    fontFamily: 'Manrope_700Bold',
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  badgeText: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 10.5,
  },
  check: {
    fontFamily: 'BricolageGrotesque_800ExtraBold',
    fontSize: 14,
  },
});
