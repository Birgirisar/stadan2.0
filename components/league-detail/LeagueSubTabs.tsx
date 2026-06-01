import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
    </View>
  );
}

export const SUBTABS_HEIGHT = 45;

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    height: SUBTABS_HEIGHT,
  },
  tab: {
    flex: 1,
    paddingVertical: 13,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
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
    left: 12,
    right: 12,
    height: 2.5,
    borderRadius: 2,
  },
});
