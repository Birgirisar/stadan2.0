import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../lib/theme/useTheme';

export type LeagueSubTabId = 'tafla' | 'leikir' | 'leikmenn' | 'lid' | 'timabil';

const TABS: Array<{ id: LeagueSubTabId; label: string }> = [
  { id: 'tafla', label: 'Tafla' },
  { id: 'leikir', label: 'Leikir' },
  { id: 'leikmenn', label: 'Leikmenn' },
  { id: 'lid', label: 'Lið' },
  { id: 'timabil', label: 'Tímabil' },
];

interface Props {
  active: LeagueSubTabId;
  onChange: (id: LeagueSubTabId) => void;
}

export function LeagueSubTabs({ active, onChange }: Props) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: `rgba(${colors.bgRgb}, 0.9)`,
          borderTopColor: colors.border,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => onChange(tab.id)}
              activeOpacity={0.7}
              style={styles.tab}
            >
              <Text
                style={[
                  styles.tabLabel,
                  { color: isActive ? colors.text : colors.textMuted },
                  isActive && styles.tabLabelActive,
                ]}
              >
                {tab.label}
              </Text>
              {isActive && (
                <View style={[styles.underline, { backgroundColor: colors.text }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

export const SUBTABS_HEIGHT = 45;

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    height: SUBTABS_HEIGHT,
  },
  row: {
    paddingHorizontal: 10,
    flexDirection: 'row',
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    position: 'relative',
    alignItems: 'center',
  },
  tabLabel: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
  },
  tabLabelActive: {
    fontFamily: 'Manrope_700Bold',
  },
  underline: {
    position: 'absolute',
    bottom: 0,
    left: 14,
    right: 14,
    height: 2.5,
    borderRadius: 2,
  },
});
