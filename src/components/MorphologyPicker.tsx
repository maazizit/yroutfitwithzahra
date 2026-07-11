import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MORPHOLOGIES, type Morphology } from '@/lib/morphology';
import { colors, radius, serif, shadow } from '@/theme';
import { MorphologyIcon } from './MorphologyIcon';

interface Props {
  value: Morphology | null;
  onChange: (value: Morphology) => void;
  compact?: boolean;
}

export function MorphologyPicker({ value, onChange, compact = false }: Props) {
  return (
    <View style={styles.grid}>
      {MORPHOLOGIES.map((m) => {
        const selected = value === m.id;
        return (
          <Pressable
            key={m.id}
            onPress={() => onChange(m.id)}
            style={({ pressed }) => [
              styles.card,
              compact && styles.cardCompact,
              selected && styles.cardSelected,
              pressed && styles.cardPressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`Silhouette ${m.label}`}
          >
            <MorphologyIcon
              morphology={m.id}
              size={compact ? 40 : 54}
              color={selected ? colors.accent : colors.faint}
            />
            <Text style={[styles.label, selected && styles.labelSelected]}>{m.label}</Text>
            {!compact && <Text style={styles.tagline}>{m.tagline}</Text>}
            {selected && (
              <View style={styles.check}>
                <Text style={styles.checkText}>✓</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  card: {
    width: '46%',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 10,
    gap: 8,
    ...shadow.card,
  },
  cardCompact: {
    width: '30%',
    paddingVertical: 12,
  },
  cardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  cardPressed: {
    opacity: 0.85,
  },
  label: {
    fontFamily: serif,
    fontSize: 16,
    color: colors.muted,
  },
  labelSelected: {
    color: colors.ink,
  },
  tagline: {
    fontSize: 11,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 15,
  },
  check: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
});
