import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GENDERS, genderLabel, type Gender } from '@/lib/gender';
import { colors, radius, serif, shadow } from '@/theme';

interface Props {
  value: Gender | null;
  onChange: (value: Gender) => void;
}

export function GenderPicker({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {GENDERS.map((g) => {
        const selected = value === g;
        return (
          <Pressable
            key={g}
            onPress={() => onChange(g)}
            style={({ pressed }) => [
              styles.card,
              selected && styles.cardSelected,
              pressed && styles.cardPressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={genderLabel(g)}
          >
            <Text style={styles.emoji}>{g === 'femme' ? '👗' : '👔'}</Text>
            <Text style={[styles.label, selected && styles.labelSelected]}>{genderLabel(g)}</Text>
            {selected ? (
              <View style={styles.check}>
                <Text style={styles.checkText}>✓</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    paddingVertical: 18,
    gap: 6,
    ...shadow.card,
  },
  cardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  cardPressed: {
    opacity: 0.9,
  },
  emoji: {
    fontSize: 28,
  },
  label: {
    fontFamily: serif,
    fontSize: 18,
    color: colors.muted,
  },
  labelSelected: {
    color: colors.ink,
    fontWeight: '600',
  },
  check: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
});
