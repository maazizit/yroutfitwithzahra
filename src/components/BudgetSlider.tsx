import React, { useMemo, useRef } from 'react';
import { PanResponder, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { colors, serif } from '@/theme';

interface Props {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

const THUMB_SIZE = 24;

/**
 * Slider maison (Pressable + PanResponder) : fonctionne à l'identique
 * sur iOS, Android et web, sans dépendance native.
 */
export function BudgetSlider({ value, onChange, min = 10, max = 200, step = 5 }: Props) {
  const trackWidth = useRef(0);
  const valueRef = useRef(value);
  valueRef.current = value;

  const setFromX = (x: number) => {
    if (trackWidth.current <= 0) return;
    const ratio = Math.min(1, Math.max(0, x / trackWidth.current));
    const raw = min + ratio * (max - min);
    const stepped = Math.round(raw / step) * step;
    const clamped = Math.min(max, Math.max(min, stepped));
    if (clamped !== valueRef.current) onChange(clamped);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => setFromX(evt.nativeEvent.locationX),
        onPanResponderMove: (evt) => setFromX(evt.nativeEvent.locationX),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [min, max, step],
  );

  const onTrackLayout = (e: LayoutChangeEvent) => {
    trackWidth.current = e.nativeEvent.layout.width;
  };

  const ratio = (value - min) / (max - min);
  const percent = `${Math.min(100, Math.max(0, ratio * 100))}%` as const;

  return (
    <View style={styles.container}>
      <Text style={styles.amount}>
        {value} €<Text style={styles.amountSuffix}> max par article</Text>
      </Text>

      <View
        style={styles.touchArea}
        onLayout={onTrackLayout}
        {...panResponder.panHandlers}
        accessibilityRole="adjustable"
        accessibilityLabel="Budget maximum par article"
        accessibilityValue={{ min, max, now: value }}
      >
        <View style={styles.track}>
          <View style={[styles.trackFill, { width: percent }]} />
        </View>
        <View style={[styles.thumb, { left: percent }]} pointerEvents="none" />
      </View>

      <View style={styles.bounds}>
        <Text style={styles.bound}>{min} €</Text>
        <Text style={styles.bound}>{max} €</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  amount: {
    fontFamily: serif,
    fontSize: 34,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: 10,
  },
  amountSuffix: {
    fontSize: 14,
    color: colors.muted,
    fontFamily: undefined,
  },
  touchArea: {
    height: 44,
    justifyContent: 'center',
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 3,
  },
  thumb: {
    position: 'absolute',
    top: (44 - THUMB_SIZE) / 2,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    marginLeft: -THUMB_SIZE / 2,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.accent,
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: '#3E362A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  bounds: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 2,
  },
  bound: {
    fontSize: 12,
    color: colors.faint,
  },
});
