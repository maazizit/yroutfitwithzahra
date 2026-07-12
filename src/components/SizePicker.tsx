import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FilterChips } from '@/components/FilterChips';
import { SIZE_OPTIONS, type SizeOption } from '@/lib/sizes';
import { colors, serif } from '@/theme';

interface Props {
  value: string | null;
  onChange: (size: string | null) => void;
  label?: string;
  compact?: boolean;
}

function toChipValue(size: string | null): SizeOption {
  if (!size) return 'Toutes';
  return (SIZE_OPTIONS as readonly string[]).includes(size) ? (size as SizeOption) : 'Toutes';
}

export function SizePicker({ value, onChange, label, compact }: Props) {
  const chipValue = toChipValue(value);

  return (
    <View style={styles.wrap}>
      {label ? <Text style={[styles.label, compact && styles.labelCompact]}>{label}</Text> : null}
      <FilterChips
        options={SIZE_OPTIONS}
        value={chipValue}
        onChange={(next) => onChange(next === 'Toutes' ? null : next)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 4,
  },
  label: {
    fontFamily: serif,
    fontSize: 15,
    color: colors.ink,
    paddingHorizontal: 18,
    marginBottom: 2,
  },
  labelCompact: {
    fontSize: 13,
    color: colors.muted,
  },
});
