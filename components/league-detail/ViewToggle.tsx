import React, { useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../lib/theme/useTheme';

export type ViewMode = 'tafla' | 'form';

interface Props {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewToggle({ mode, onChange }: Props) {
  const { colors } = useTheme();
  const thumbAnim = useRef(new Animated.Value(mode === 'form' ? 1 : 0)).current;
  const [halfWidth, setHalfWidth] = useState(0);

  const setMode = (next: ViewMode) => {
    onChange(next);
    Animated.spring(thumbAnim, {
      toValue: next === 'form' ? 1 : 0,
      useNativeDriver: true,
      bounciness: 4,
      speed: 20,
    }).start();
  };

  return (
    <View
      style={[styles.container, { backgroundColor: colors.surfaceSunken }]}
      onLayout={(e) => setHalfWidth(e.nativeEvent.layout.width / 2)}
    >
      <Animated.View
        style={[
          styles.thumb,
          {
            backgroundColor: colors.surface,
            width: halfWidth > 0 ? halfWidth - 3 : '50%',
            transform: [
              {
                translateX: thumbAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, halfWidth],
                }),
              },
            ],
          },
        ]}
      />
      <TouchableOpacity
        onPress={() => setMode('tafla')}
        activeOpacity={0.7}
        style={styles.option}
      >
        <Text
          style={[
            styles.optionText,
            { color: mode === 'tafla' ? colors.text : colors.textMuted },
          ]}
        >
          Tafla
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setMode('form')}
        activeOpacity={0.7}
        style={styles.option}
      >
        <Text
          style={[
            styles.optionText,
            { color: mode === 'form' ? colors.text : colors.textMuted },
          ]}
        >
          Form
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 18,
    marginTop: 14,
    marginBottom: 8,
    borderRadius: 12,
    padding: 3,
    flexDirection: 'row',
    position: 'relative',
    overflow: 'hidden',
  },
  thumb: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    left: 3,
    borderRadius: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  option: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    zIndex: 2,
  },
  optionText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12.5,
  },
});
