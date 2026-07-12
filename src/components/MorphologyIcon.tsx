import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import type { Morphology } from '@/lib/morphology';
import { colors } from '@/theme';

interface Props {
  morphology: Morphology;
  size?: number;
  color?: string;
  selected?: boolean;
  /** Affiche un hijab stylisé (mode pudeur) */
  modest?: boolean;
}

const VIEW_W = 72;
const VIEW_H = 96;

/** Silhouettes avatar : tête + corps rempli pour chaque morphologie. */
export function MorphologyIcon({
  morphology,
  size = 72,
  color,
  selected = false,
  modest = false,
}: Props) {
  const height = Math.round(size * (VIEW_H / VIEW_W));
  const stroke = color ?? (selected ? colors.accentDark : colors.muted);
  const bodyFill = selected ? colors.accent : colors.faint;
  const auraFill = selected ? colors.goldSoft : colors.sageSoft;
  const headFill = selected ? colors.accentSoft : colors.card;

  const body = BODY[morphology];
  const legs = LEGS[morphology];

  return (
    <Svg width={size} height={height} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} fill="none">
      <Circle cx="36" cy="48" r="34" fill={auraFill} />
      <Circle cx="36" cy="17" r="12" fill={headFill} stroke={stroke} strokeWidth="2" />
      {modest ? (
        <Path
          d="M18 20 C22 14 30 11 36 11 C42 11 50 14 54 20 C52 28 46 34 36 36 C26 34 20 28 18 20 Z"
          fill={selected ? colors.sageSoft : colors.ivory}
          stroke={stroke}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      ) : null}
      <Path
        d={body}
        fill={bodyFill}
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {legs ? (
        <Path
          d={legs}
          fill={bodyFill}
          stroke={stroke}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ) : null}
    </Svg>
  );
}

/** Corps stylisé sous la tête — proportions exagérées pour la lisibilité. */
const BODY: Record<Morphology, string> = {
  /** Épaules ≈ hanches, taille marquée */
  sablier: `
    M36 31
    C29 31 23 35 22 41
    C20 46 19 50 21 54
    C18 58 18 62 21 66
    C22 74 28 81 36 81
    C44 81 50 74 51 66
    C54 62 54 58 51 54
    C53 50 52 46 50 41
    C49 35 43 31 36 31
    Z
  `,
  /** Hanches plus larges que les épaules */
  poire: `
    M36 31
    C31 31 27 33 25 37
    C23 41 22 46 22 52
    C20 60 20 70 24 77
    C28 83 32 85 36 85
    C42 85 48 82 52 75
    C56 68 56 58 54 50
    C52 42 50 37 47 34
    C44 31 40 31 36 31
    Z
  `,
  /** Buste rond */
  pomme: `
    M36 31
    C27 31 20 39 20 50
    C20 58 24 65 36 67
    C48 65 52 58 52 50
    C52 39 45 31 36 31
    Z
  `,
  /** Silhouette droite, peu de courbes */
  rectangle: `
    M27 31
    H45
    C48 31 50 33 50 36
    V80
    C50 83 48 85 45 85
    H27
    C24 85 22 83 22 80
    V36
    C22 33 24 31 27 31
    Z
  `,
  /** Épaules larges, hanches étroites */
  triangle_inverse: `
    M36 31
    C46 31 54 34 58 40
    C60 44 59 48 56 52
    L50 64
    C46 74 42 82 36 84
    C30 82 26 74 22 64
    L16 52
    C13 48 12 44 14 40
    C18 34 26 31 36 31
    Z
  `,
};

const LEGS: Partial<Record<Morphology, string>> = {
  pomme: `
    M32 67
    L31 84
    C31 86 33 88 36 88
    C39 88 41 86 41 84
    L40 67
    Z
  `,
};
