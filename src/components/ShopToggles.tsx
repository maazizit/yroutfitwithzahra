import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { morphologyLabel } from '@/lib/morphology';
import type { Morphology } from '@/lib/morphology';
import { useResponsiveLayout } from '@/lib/layout';
import { colors, radius } from '@/theme';

interface Props {
  morphology: Morphology;
  morphologyOnly: boolean;
  modestOnly: boolean;
  profileModestMode: boolean;
  onMorphologyOnlyChange: (value: boolean) => void;
  onModestOnlyChange: (value: boolean) => void;
}

function TogglePill({
  label,
  active,
  onPress,
  accent,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  accent?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        active && styles.pillActive,
        accent && active && styles.pillModestActive,
        pressed && styles.pillPressed,
      ]}
      accessibilityRole="switch"
      accessibilityState={{ checked: active }}
    >
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function ShopToggles({
  morphology,
  morphologyOnly,
  modestOnly,
  profileModestMode,
  onMorphologyOnlyChange,
  onModestOnlyChange,
}: Props) {
  const { pagePadding } = useResponsiveLayout();

  return (
    <View style={[styles.wrap, { paddingHorizontal: pagePadding }]}>
      <Text style={styles.label}>Filtres rapides</Text>
      <View style={styles.row}>
        <TogglePill
          label={`Silhouette ${morphologyLabel(morphology)}`}
          active={morphologyOnly}
          onPress={() => onMorphologyOnlyChange(!morphologyOnly)}
        />
        <TogglePill
          label="🧕 Pudique"
          active={modestOnly || profileModestMode}
          onPress={() => onModestOnlyChange(!modestOnly)}
          accent
        />
      </View>
      {profileModestMode && !modestOnly && (
        <Text style={styles.hint}>Mode Pudeur actif dans ton profil</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 2,
    marginBottom: 8,
    gap: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  pillActive: {
    borderColor: colors.ink,
    backgroundColor: colors.goldSoft,
  },
  pillModestActive: {
    borderColor: colors.sage,
    backgroundColor: colors.sageSoft,
  },
  pillPressed: {
    opacity: 0.88,
  },
  pillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.muted,
  },
  pillTextActive: {
    color: colors.ink,
  },
  hint: {
    fontSize: 11,
    color: colors.faint,
    fontStyle: 'italic',
  },
});
