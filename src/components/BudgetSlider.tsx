import Slider from '@react-native-community/slider';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, serif } from '@/theme';

interface Props {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function BudgetSlider({ value, onChange, min = 10, max = 200 }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.amount}>
        {value} €<Text style={styles.amountSuffix}> max par article</Text>
      </Text>
      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={5}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={colors.accent}
        maximumTrackTintColor={colors.border}
        thumbTintColor={colors.accent}
        accessibilityLabel="Budget maximum par article"
      />
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
    marginBottom: 6,
  },
  amountSuffix: {
    fontSize: 14,
    color: colors.muted,
    fontFamily: undefined,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  bounds: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  bound: {
    fontSize: 12,
    color: colors.faint,
  },
});
