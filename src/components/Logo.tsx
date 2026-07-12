import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors, serif } from '@/theme';

/** Logo officiel YourOutfit WithZahra (assets/) */
const MARK = require('../../assets/mark.png');
const FULL_LOGO = require('../../assets/logo.png');

/** Logo complet (emblème + wordmark) — onboarding, splash. */
export function BrandLogo({ size = 160 }: { size?: number }) {
  return (
    <Image
      source={FULL_LOGO}
      style={{ width: size, height: size, borderRadius: size / 8 }}
      resizeMode="contain"
      accessibilityLabel="YourOutfit WithZahra"
    />
  );
}

/**
 * Marque "Outfit with Zahra" — cintre minimaliste + fleur (zahra = fleur),
 * entièrement vectoriel (utilisé en secours).
 */
export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Path
        d="M24 12c-2.6 0-4.7 2.1-4.7 4.7h3c0-.95.76-1.7 1.7-1.7s1.7.75 1.7 1.7c0 .8-.55 1.45-1.35 1.7-1.5.45-2.35 1.7-2.35 3.2v1.4"
        stroke={colors.ink}
        strokeWidth={2.1}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M24 23.6 7.9 33.5c-1.6.98-.9 3.3 1 3.3h30.2c1.9 0 2.6-2.32 1-3.3L24 23.6Z"
        stroke={colors.ink}
        strokeWidth={2.1}
        strokeLinejoin="round"
        fill="none"
      />
      <Circle cx={36.5} cy={9.5} r={2.7} fill={colors.accent} opacity={0.9} />
      <Circle cx={31.7} cy={13} r={2.7} fill={colors.accent} opacity={0.65} />
      <Circle cx={33.6} cy={18.6} r={2.7} fill={colors.accent} opacity={0.75} />
      <Circle cx={39.4} cy={18.6} r={2.7} fill={colors.accent} opacity={0.65} />
      <Circle cx={41.3} cy={13} r={2.7} fill={colors.accent} opacity={0.75} />
      <Circle cx={36.5} cy={14.5} r={2.4} fill={colors.gold} />
    </Svg>
  );
}

export function LogoHeader({ subtitle, compact }: { subtitle?: string; compact?: boolean }) {
  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      <Image
        source={MARK}
        style={[styles.mark, compact && styles.markCompact]}
        resizeMode="contain"
        accessibilityLabel="Logo"
      />
      <View style={styles.textBlock}>
        <Text style={[styles.wordmark, compact && styles.wordmarkCompact]} numberOfLines={1}>
          YourOutfit <Text style={styles.with}>with</Text> Zahra
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, compact && styles.subtitleCompact]}>{subtitle}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  rowCompact: {
    gap: 12,
  },
  mark: {
    width: 42,
    height: 42,
    borderRadius: 10,
  },
  markCompact: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  textBlock: {
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
  },
  wordmark: {
    fontFamily: serif,
    fontSize: 21,
    color: colors.ink,
    letterSpacing: 0.3,
  },
  wordmarkCompact: {
    fontSize: 19,
    lineHeight: 24,
  },
  with: {
    fontStyle: 'italic',
    color: colors.accent,
  },
  subtitle: {
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  subtitleCompact: {
    fontSize: 10,
    letterSpacing: 1.8,
    marginTop: 3,
  },
});
