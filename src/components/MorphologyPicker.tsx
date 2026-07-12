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
  const avatarSize = compact ? 52 : 68;

  return (
    <ScalePressable
      onPress={onPress}
      style={[styles.card, compact && styles.cardCompact, selected && styles.cardSelected]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`Silhouette ${info.label} — ${info.tagline}`}
    >
      <Animated.View style={[styles.cardInner, { transform: [{ scale: popScale }] }]}>
        <View style={[styles.avatarRing, selected && styles.avatarRingSelected]}>
          <MorphologyIcon
            morphology={info.id}
            size={avatarSize}
            selected={selected}
          />
        </View>
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
  const selectedInfo = MORPHOLOGIES.find((m) => m.id === value);

  return (
    <View style={styles.wrap}>
      {selectedInfo && !compact && (
        <View style={styles.preview}>
          <MorphologyIcon morphology={selectedInfo.id} size={56} selected />
          <View style={styles.previewText}>
            <Text style={styles.previewTitle}>{selectedInfo.label}</Text>
            <Text style={styles.previewTagline}>{selectedInfo.tagline}</Text>
          </View>
        </View>
      )}

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
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 16,
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.goldSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  previewText: {
    flex: 1,
    gap: 4,
  },
  previewTitle: {
    fontFamily: serif,
    fontSize: 20,
    color: colors.ink,
  },
  previewTagline: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
  },
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
    paddingVertical: 14,
    paddingHorizontal: 8,
    ...shadow.card,
  },
  cardCompact: {
    paddingVertical: 10,
  },
  cardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  cardInner: {
    alignItems: 'center',
    gap: 6,
    width: '100%',
  },
  avatarRing: {
    borderRadius: radius.lg,
    backgroundColor: colors.ivory,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarRingSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.white,
  },
  label: {
    fontFamily: serif,
    fontSize: 15,
    color: colors.muted,
    marginTop: 2,
  },
  labelSelected: {
    color: colors.ink,
    fontWeight: '600',
  },
  tagline: {
    fontSize: 10.5,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 14,
    paddingHorizontal: 4,
  },
  check: {
    position: 'absolute',
    top: 8,
    right: 8,
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
