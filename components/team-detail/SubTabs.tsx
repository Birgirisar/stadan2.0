import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../lib/theme/useTheme';

export type TeamSubTabId = 'yfirlit' | 'leikir' | 'leikmenn' | 'timabil';

interface Tab {
  id: TeamSubTabId;
  label: string;
}

const TABS: Tab[] = [
  { id: 'yfirlit', label: 'Yfirlit' },
  { id: 'leikir', label: 'Leikir' },
  { id: 'leikmenn', label: 'Leikmenn' },
  { id: 'timabil', label: 'Tímabil' },
];

interface Props {
  activeTab: TeamSubTabId;
  onTabChange: (tab: TeamSubTabId) => void;
}

export function TeamSubTabs({ activeTab, onTabChange }: Props) {
  const { colors } = useTheme();

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <Pressable
              key={tab.id}
              onPress={() => onTabChange(tab.id)}
              style={styles.tab}
            >
              <Text
                style={[
                  styles.label,
                  { color: isActive ? colors.text : colors.textMuted },
                ]}
              >
                {tab.label}
              </Text>
              {isActive && (
                <View style={[styles.underline, { backgroundColor: colors.accent }]} />
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: 0,
    borderBottomWidth: 1,
  },
  container: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    height: 46,
    alignItems: 'center',
    gap: 4,
  },
  tab: {
    paddingHorizontal: 12,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  label: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13.5,
  },
  underline: {
    position: 'absolute',
    bottom: 0,
    left: 12,
    right: 12,
    height: 2,
    borderRadius: 1,
  },
});
