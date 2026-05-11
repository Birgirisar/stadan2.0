import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { BottomDock } from '../../components/ui/BottomDock';
import { useTheme } from '../../lib/theme/useTheme';

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Tabs
        tabBar={() => null}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="index" options={{ title: 'Leikir' }} />
        <Tabs.Screen name="mot" options={{ title: 'Mót' }} />
        <Tabs.Screen name="frettir" options={{ title: 'Fréttir' }} />
      </Tabs>
      <BottomDock />
    </View>
  );
}
