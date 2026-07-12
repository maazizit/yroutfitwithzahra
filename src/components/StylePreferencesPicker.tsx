import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScalePressable } from '@/components/anim';
import { MultiSelectSheet } from '@/components/MultiSelectSheet';
import { COLOR_OPTIONS, colorsSummary } from '@/lib/colors';
import { ALL_SIZE_OPTIONS, SIZE_GROUPS, sizesSummary } from '@/lib/sizes';
import { colors, radius, serif } from '@/theme';

interface Props {
  sizes: string[];
  colors: string[];
  onChangeSizes: (sizes: string[]) => void;
  onChangeColors: (colors: string[]) => void;
  compact?: boolean;
}

export function StylePreferencesPicker({
  sizes,
  colors: colorPref,
  onChangeSizes,
  onChangeColors,
  compact,
}: Props) {
  const [sizeOpen, setSizeOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);

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
    <View style={styles.wrap}>
      <Text style={[styles.hint, compact && styles.hintCompact]}>
        Multi-sélection — laisse vide pour tout voir
      </Text>
      <View style={styles.row}>
        <ScalePressable
          onPress={() => setSizeOpen(true)}
          pressedScale={0.97}
          style={[styles.btn, sizes.length > 0 && styles.btnActive]}
        >
          <Text style={styles.btnLabel}>Tailles</Text>
          <Text style={[styles.btnValue, sizes.length > 0 && styles.btnValueActive]}>
            {sizesSummary(sizes)}
          </Text>
        </ScalePressable>
        <ScalePressable
          onPress={() => setColorOpen(true)}
          pressedScale={0.97}
          style={[styles.btn, colorPref.length > 0 && styles.btnActive]}
        >
          <Text style={styles.btnLabel}>Couleurs</Text>
          <Text style={[styles.btnValue, colorPref.length > 0 && styles.btnValueActive]}>
            {colorsSummary(colorPref)}
          </Text>
        </ScalePressable>
      </View>

      <MultiSelectSheet
        visible={sizeOpen}
        title="Mes tailles"
        subtitle="Standard, numérique EU et curvy — choisis-en plusieurs"
        options={sizeOptions}
        groups={sizeGroups}
        selected={sizes}
        onChange={onChangeSizes}
        onClose={() => setSizeOpen(false)}
      />
      <MultiSelectSheet
        visible={colorOpen}
        title="Mes couleurs"
        subtitle="Les teintes que tu portes le plus"
        options={colorOptions}
        selected={colorPref}
        onChange={onChangeColors}
        onClose={() => setColorOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  hint: {
    fontSize: 12.5,
    color: colors.muted,
    lineHeight: 17,
  },
  hintCompact: { fontSize: 11.5 },
  row: { flexDirection: 'row', gap: 10 },
  btn: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 14,
    gap: 4,
  },
  btnActive: {
    borderColor: colors.ink,
    backgroundColor: colors.goldSoft,
  },
  btnLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  btnValue: {
    fontFamily: serif,
    fontSize: 16,
    color: colors.muted,
  },
  btnValueActive: {
    color: colors.ink,
    fontWeight: '600',
  },
});
