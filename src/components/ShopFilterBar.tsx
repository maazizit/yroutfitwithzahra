import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MultiSelectSheet } from '@/components/MultiSelectSheet';
import { COLOR_OPTIONS, colorsSummary } from '@/lib/colors';
import { useResponsiveLayout } from '@/lib/layout';
import { ALL_SIZE_OPTIONS, SIZE_GROUPS, sizesSummary } from '@/lib/sizes';
import { colors, radius } from '@/theme';

export interface ShopFilters {
  sizes: string[];
  colors: string[];
}

interface Props {
  sizes: string[];
  colors: string[];
  onChangeSizes: (sizes: string[]) => void;
  onChangeColors: (colors: string[]) => void;
}

function FilterPill({
  label,
  value,
  active,
  onPress,
  wide,
}: {
  label: string;
  value: string;
  active: boolean;
  onPress: () => void;
  wide?: boolean;
}) {
  return (
    <View style={[styles.pillWrap, wide && styles.pillWrapWide]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.pill,
          wide && styles.pillWide,
          active && styles.pillActive,
          pressed && styles.pillPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${label} : ${value}`}
      >
        <Text style={styles.pillLabel}>{label}</Text>
        <Text style={[styles.pillValue, active && styles.pillValueActive]} numberOfLines={1}>
          {value}
        </Text>
      </Pressable>
    </View>
  );
}

export function ShopFilterBar({
  sizes,
  colors: colorFilter,
  onChangeSizes,
  onChangeColors,
}: Props) {
  const { isWide, pagePadding } = useResponsiveLayout();
  const [sizeOpen, setSizeOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);

  const activeCount = sizes.length + colorFilter.length;

  const sizeOptions = useMemo(
    () => ALL_SIZE_OPTIONS.map((id) => ({ id, label: id })),
    [],
  );

  const sizeGroups = useMemo(
    () => SIZE_GROUPS.map((g) => ({ title: g.title, optionIds: [...g.options] })),
    [],
  );

  const colorOptions = useMemo(
    () => COLOR_OPTIONS.map((c) => ({ id: c.id, label: c.label, swatch: c.swatch })),
    [],
  );

  return (
    <View style={styles.section}>
      <Text style={[styles.headerLabel, { paddingHorizontal: pagePadding }]}>Affiner</Text>
      {isWide ? (
        <View style={[styles.rowWide, { paddingHorizontal: pagePadding }]}>
          <FilterPill
            label="Taille"
            value={sizesSummary(sizes)}
            active={sizes.length > 0}
            onPress={() => setSizeOpen(true)}
            wide
          />
          <FilterPill
            label="Couleur"
            value={colorsSummary(colorFilter)}
            active={colorFilter.length > 0}
            onPress={() => setColorOpen(true)}
            wide
          />
          {activeCount > 0 && (
            <View style={styles.pillWrapWide}>
              <Pressable
                onPress={() => {
                  onChangeSizes([]);
                  onChangeColors([]);
                }}
                style={({ pressed }) => [styles.resetPill, styles.pillWide, pressed && styles.pillPressed]}
                accessibilityRole="button"
                accessibilityLabel={`Effacer ${activeCount} filtre${activeCount > 1 ? 's' : ''}`}
              >
                <Text style={styles.resetText}>Effacer ({activeCount})</Text>
              </Pressable>
            </View>
          )}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.row, { paddingHorizontal: pagePadding }]}
        >
          <FilterPill
            label="Taille"
            value={sizesSummary(sizes)}
            active={sizes.length > 0}
            onPress={() => setSizeOpen(true)}
          />
          <FilterPill
            label="Couleur"
            value={colorsSummary(colorFilter)}
            active={colorFilter.length > 0}
            onPress={() => setColorOpen(true)}
          />
          {activeCount > 0 && (
            <View style={styles.pillWrap}>
              <Pressable
                onPress={() => {
                  onChangeSizes([]);
                  onChangeColors([]);
                }}
                style={({ pressed }) => [styles.resetPill, pressed && styles.pillPressed]}
                accessibilityRole="button"
                accessibilityLabel={`Effacer ${activeCount} filtre${activeCount > 1 ? 's' : ''}`}
              >
                <Text style={styles.resetText}>Effacer ({activeCount})</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      )}

      <MultiSelectSheet
        visible={sizeOpen}
        title="Tailles"
        subtitle="Choisis une ou plusieurs tailles — curvy & plus-size inclus"
        options={sizeOptions}
        groups={sizeGroups}
        selected={sizes}
        onChange={onChangeSizes}
        onClose={() => setSizeOpen(false)}
      />

      <MultiSelectSheet
        visible={colorOpen}
        title="Couleurs"
        subtitle="Sélectionne tes couleurs préférées"
        options={colorOptions}
        selected={colorFilter}
        onChange={onChangeColors}
        onClose={() => setColorOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 4,
    marginBottom: 10,
    gap: 8,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  row: {
    gap: 10,
    alignItems: 'stretch',
  },
  rowWide: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'stretch',
  },
  pillWrap: {
    flexShrink: 0,
  },
  pillWrapWide: {
    flex: 1,
    minWidth: 0,
  },
  pill: {
    minWidth: 108,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 2,
  },
  pillWide: {
    minWidth: 0,
    width: '100%',
  },
  pillActive: {
    borderColor: colors.ink,
    backgroundColor: colors.goldSoft,
  },
  pillPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  pillLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.faint,
  },
  pillValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.muted,
  },
  pillValueActive: {
    color: colors.ink,
  },
  resetPill: {
    minWidth: 108,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accentDark,
    textAlign: 'center',
  },
});
