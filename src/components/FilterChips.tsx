import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { colors, radius } from '@/theme';
import { ScalePressable } from './anim';

interface Props<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}

interface ChipLayout {
  x: number;
  width: number;
}

/**
 * Filtres animés : le chip actif se gonfle légèrement et une ligne
 * de couleur fluide glisse sous lui.
 */
export function FilterChips<T extends string>({ options, value, onChange }: Props<T>) {
  const layouts = useRef<Partial<Record<T, ChipLayout>>>({});
  const underlineX = useRef(new Animated.Value(0)).current;
  const underlineW = useRef(new Animated.Value(0)).current;
  const [ready, setReady] = useState(false);

  const moveUnderline = (target: T, animate: boolean) => {
    const layout = layouts.current[target];
    if (!layout) return;
    const toX = layout.x + 10;
    const toW = Math.max(18, layout.width - 20);
    if (!animate) {
      underlineX.setValue(toX);
      underlineW.setValue(toW);
      setReady(true);
      return;
    }
    Animated.parallel([
      Animated.spring(underlineX, { toValue: toX, useNativeDriver: false, speed: 22, bounciness: 7 }),
      Animated.spring(underlineW, { toValue: toW, useNativeDriver: false, speed: 22, bounciness: 7 }),
    ]).start();
  };

  useEffect(() => {
    moveUnderline(value, ready);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const onChipLayout = (option: T) => (e: LayoutChangeEvent) => {
    layouts.current[option] = {
      x: e.nativeEvent.layout.x,
      width: e.nativeEvent.layout.width,
    };
    if (option === value && !ready) moveUnderline(value, false);
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {options.map((option) => {
        const active = option === value;
        return (
          <View key={option} onLayout={onChipLayout(option)}>
            <ScalePressable
              onPress={() => onChange(option)}
              pressedScale={0.92}
              style={[styles.chip, active && styles.chipActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{option}</Text>
            </ScalePressable>
          </View>
        );
      })}
      {ready && (
        <Animated.View
          pointerEvents="none"
          style={[styles.underline, { left: underlineX, width: underlineW }]}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 18,
    paddingBottom: 10,
    gap: 8,
  },
  chip: {
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  chipActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  chipText: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  underline: {
    position: 'absolute',
    bottom: 2,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.gold,
  },
});
