import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { MORPHOLOGIES, type Morphology, type MorphologyInfo } from '@/lib/morphology';
import { colors, radius, serif, shadow } from '@/theme';
import { FadeInView, ScalePressable, usePopAnimation } from './anim';
import { MorphologyIcon } from './MorphologyIcon';

interface Props {
  value: Morphology | null;
  onChange: (value: Morphology) => void;
  compact?: boolean;
  animateEntrance?: boolean;
}

interface CardProps {
  info: MorphologyInfo;
  selected: boolean;
  compact: boolean;
  onPress: () => void;
}

function MorphoCard({ info, selected, compact, onPress }: CardProps) {
  const popScale = usePopAnimation(selected);

  return (
    <ScalePressable
      onPress={onPress}
      style={[styles.card, compact && styles.cardCompact, selected && styles.cardSelected]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`Silhouette ${info.label}`}
    >
      <Animated.View style={[styles.cardInner, { transform: [{ scale: popScale }] }]}>
        <MorphologyIcon
          morphology={info.id}
          size={compact ? 40 : 54}
          color={selected ? colors.accent : colors.faint}
        />
        <Text style={[styles.label, selected && styles.labelSelected]}>{info.label}</Text>
        {!compact && <Text style={styles.tagline}>{info.tagline}</Text>}
      </Animated.View>
      {selected && (
        <View style={styles.check}>
          <Text style={styles.checkText}>✓</Text>
        </View>
      )}
    </ScalePressable>
  );
}

export function MorphologyPicker({ value, onChange, compact = false, animateEntrance = false }: Props) {
  return (
    <View style={styles.grid}>
      {MORPHOLOGIES.map((m, index) => {
        const slotStyle = compact ? styles.slotCompact : styles.slot;
        const card = (
          <MorphoCard
            info={m}
            selected={value === m.id}
            compact={compact}
            onPress={() => onChange(m.id)}
          />
        );
        return animateEntrance ? (
          <FadeInView key={m.id} delay={120 + index * 90} style={slotStyle}>
            {card}
          </FadeInView>
        ) : (
          <View key={m.id} style={slotStyle}>
            {card}
          </View>
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
  slot: {
    width: '46%',
  },
  slotCompact: {
    width: '30%',
  },
  card: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 10,
    ...shadow.card,
  },
  cardCompact: {
    paddingVertical: 12,
  },
  cardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  cardInner: {
    alignItems: 'center',
    gap: 8,
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
