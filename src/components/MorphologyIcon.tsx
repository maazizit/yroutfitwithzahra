import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import type { Morphology } from '@/lib/morphology';
import { colors } from '@/theme';

interface Props {
  morphology: Morphology;
  size?: number;
  color?: string;
}

/** Icônes vectorielles minimalistes des 5 silhouettes. */
export function MorphologyIcon({ morphology, size = 56, color = colors.accent }: Props) {
  const common = { width: size, height: size, viewBox: '0 0 56 56', fill: 'none' as const };

  switch (morphology) {
    case 'sablier':
      return (
        <Svg {...common}>
          <Path
            d="M16 10h24c0 10-7 12-7 18s7 8 7 18H16c0-10 7-12 7-18s-7-8-7-18Z"
            stroke={color}
            strokeWidth={2.4}
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      );
    case 'poire':
      return (
        <Svg {...common}>
          <Circle cx={28} cy={15} r={7} stroke={color} strokeWidth={2.4} fill="none" />
          <Path
            d="M28 22c-9 4-14 10.5-14 17 0 5.5 6.3 9 14 9s14-3.5 14-9c0-6.5-5-13-14-17Z"
            stroke={color}
            strokeWidth={2.4}
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      );
    case 'pomme':
      return (
        <Svg {...common}>
          <Circle cx={28} cy={28} r={16} stroke={color} strokeWidth={2.4} fill="none" />
          <Path
            d="M28 12c1-3 3-5 6-5"
            stroke={color}
            strokeWidth={2.4}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      );
    case 'rectangle':
      return (
        <Svg {...common}>
          <Rect
            x={16}
            y={9}
            width={24}
            height={38}
            rx={7}
            stroke={color}
            strokeWidth={2.4}
            fill="none"
          />
        </Svg>
      );
    case 'triangle_inverse':
      return (
        <Svg {...common}>
          <Path
            d="M11 12h34L31.5 44c-1.5 3.4-5.5 3.4-7 0L11 12Z"
            stroke={color}
            strokeWidth={2.4}
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      );
    default:
      return null;
  }
}
