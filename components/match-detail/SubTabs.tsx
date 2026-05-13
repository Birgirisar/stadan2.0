import React, { useRef } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../lib/theme/useTheme';

export type SubTabId = 'yfirlit' | 'lysing' | 'lidin' | 'tafla' | 'tolfraedi' | 'innbyrðis';

interface TabDef {
  id: SubTabId;
  label: string;
}

const ALL_TABS: TabDef[] = [
  { id: 'yfirlit', label: 'Yfirlit' },
  { id: 'lysing', label: 'Lýsing' },
  { id: 'lidin', label: 'Liðin' },
  { id: 'tafla', label: 'Tafla' },
  { id: 'tolfraedi', label: 'Tölfræði' },
  { id: 'innbyrðis', label: 'Innbyrðis' },
];

const PENDING_TABS: SubTabId[] = ['yfirlit', 'lidin', 'tafla', 'innbyrðis'];

interface Props {
  activeTab: SubTabId;
  onTabChange: (tab: SubTabId) => void;
  isPending?: boolean;
}

export function SubTabs({ activeTab, onTabChange, isPending = false }: Props) {
  const { colors } = useTheme();
  const tabs = isPending ? ALL_TABS.filter((t) => PENDING_TABS.includes(t.id)) : ALL_TABS;

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
      >
        {tabs.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => onTabChange(tab.id)}
              activeOpacity={0.7}
              style={styles.tab}
            >
              <Text
                style={[
                  styles.label,
                  { color: active ? colors.text : colors.textMuted },
                  active && styles.labelActive,
                ]}
              >
                {tab.label}
              </Text>
              {active && (
                <View style={[styles.indicator, { backgroundColor: colors.text }]} />
              )}
            </TouchableOpacity>
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
  scrollContent: {
    paddingHorizontal: 10,
  },
  tab: {
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 12,
    position: 'relative',
  },
  label: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    letterSpacing: -0.1,
  },
  labelActive: {
    fontFamily: 'Manrope_800ExtraBold',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: 14,
    right: 14,
    height: 2.5,
    borderRadius: 2,
  },
});
