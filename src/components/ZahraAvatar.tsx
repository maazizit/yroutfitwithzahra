import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { colors } from '@/theme';

/**
 * Avatar de Zahra — portrait vectoriel stylisé (hijab noir, blazer),
 * dans l'esthétique de la marque.
 *
 * Pour utiliser ta vraie photo : ajoute le fichier `assets/zahra.jpg`
 * au projet puis remplace `null` par `require('../../assets/zahra.jpg')`.
 */
const PHOTO: number | null = null;

export function ZahraAvatar({ size = 40 }: { size?: number }) {
  if (PHOTO) {
    return (
      <View style={[styles.ring, { width: size + 4, height: size + 4, borderRadius: (size + 4) / 2 }]}>
        <Image
          source={PHOTO}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          accessibilityLabel="Zahra"
        />
      </View>
    );
  }

  return (
    <View style={[styles.ring, { width: size + 4, height: size + 4, borderRadius: (size + 4) / 2 }]}>
      <Svg width={size} height={size} viewBox="0 0 96 96">
        {/* fond */}
        <Circle cx={48} cy={48} r={48} fill={colors.accentSoft} />
        {/* voile : volume arrière */}
        <Path
          d="M48 12c-20 0-30 15-30 32 0 12 4 20 8 26l4 14h36l4-14c4-6 8-14 8-26 0-17-10-32-30-32Z"
          fill="#211D1A"
        />
        {/* visage */}
        <Ellipse cx={48} cy={46} rx={14.5} ry={17.5} fill="#EAC0A2" />
        {/* bord du voile encadrant le visage */}
        <Path
          d="M48 21c-13 0-20 11-20 24 0 4 .8 8 2 11l3-2c-1-3-1.6-6-1.6-9C31.4 32.5 38 26 48 26s16.6 6.5 16.6 19c0 3-.6 6-1.6 9l3 2c1.2-3 2-7 2-11 0-13-7-24-20-24Z"
          fill="#151210"
        />
        {/* sourcils */}
        <Path d="M39 41.5c2-1.6 5-1.8 7-.8" stroke="#4A3526" strokeWidth={1.6} strokeLinecap="round" fill="none" />
        <Path d="M57 41.5c-2-1.6-5-1.8-7-.8" stroke="#4A3526" strokeWidth={1.6} strokeLinecap="round" fill="none" />
        {/* yeux */}
        <Ellipse cx={42} cy={46.5} rx={2.1} ry={2.6} fill="#3A2A1E" />
        <Ellipse cx={54} cy={46.5} rx={2.1} ry={2.6} fill="#3A2A1E" />
        {/* nez */}
        <Path d="M48 49v5.5c0 .9-1.2 1.6-2.2 1.2" stroke="#D8A583" strokeWidth={1.4} strokeLinecap="round" fill="none" />
        {/* lèvres */}
        <Path d="M44 59c1.4 1.2 2.7 1.6 4 1.6s2.6-.4 4-1.6c-1.2-1.5-2.6-2.1-4-2.1s-2.8.6-4 2.1Z" fill={colors.accent} />
        {/* drapé du voile sous le menton */}
        <Path
          d="M31 55c2 12 8 18 17 20 9-2 15-8 17-20 2 10-1 19-5 25l-4 6H40l-4-6c-4-6-7-15-5-25Z"
          fill="#211D1A"
        />
        {/* blazer */}
        <Path d="M20 96c2-14 12-20 28-20s26 6 28 20H20Z" fill="#1B1815" />
        {/* col du blazer */}
        <Path d="M42 78l6 8 6-8" stroke="#3A332C" strokeWidth={2} strokeLinecap="round" fill="none" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.gold,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
});
