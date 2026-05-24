import React, { useRef } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../lib/theme/useTheme';
import type { SubTabId, SubTabDef } from '../../lib/utils/matchSubTabs';

// Re-export so existing imports of SubTabId from this file continue to work.
export type { SubTabId } from '../../lib/utils/matchSubTabs';

// Fallback full list used when no explicit `tabs` prop is provided.
const ALL_TABS: SubTabDef[] = [
  { id: 'yfirlit', label: 'Yfirlit' },
  { id: 'lysing', label: 'Lýsing' },
  { id: 'lidin', label: 'Liðin' },
  { id: 'tafla', label: 'Tafla' },
  { id: 'tolfraedi', label: 'Tölfræði' },
  { id: 'innbyrðis', label: 'Innbyrðis' },
];

const PENDING_TAB_IDS: SubTabId[] = ['yfirlit', 'lidin', 'tafla', 'innbyrðis'];

interface Props {
  activeTab: SubTabId;
  onTabChange: (tab: SubTabId) => void;
  /**
   * Explicit ordered tab list. When supplied this takes full precedence and
   * `isPending` is ignored. Pass the result of `getAvailableSubTabs(fixture)`.
   */
  tabs?: SubTabDef[];
  /** Legacy prop — used as fallback when `tabs` is not provided. */
  isPending?: boolean;
}

export function SubTabs({ activeTab, onTabChange, tabs, isPending = false }: Props) {
  const { colors } = useTheme();
  const displayTabs = tabs ?? (isPending
    ? ALL_TABS.filter((t) => PENDING_TAB_IDS.includes(t.id))
    : ALL_TABS);
  const scrollRef = useRef<ScrollView>(null);

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
      >
        {displayTabs.map((tab) => {
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
