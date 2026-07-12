import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import type { Category } from '@/lib/types';

interface Props {
  category: Category;
  size?: number;
  color?: string;
}

/** Icônes vectorielles minimalistes par catégorie — placeholders élégants. */
export function CategoryIcon({ category, size = 48, color = '#B76E5D' }: Props) {
  const common = { width: size, height: size, viewBox: '0 0 48 48', fill: 'none' as const };
  const stroke = { stroke: color, strokeWidth: 2, strokeLinejoin: 'round' as const, fill: 'none' as const };

  switch (category) {
    case 'Robes':
      return (
        <Svg {...common}>
          <Path {...stroke} d="M18 6l6 5 6-5 3 8-4 5c3 7 5 14 5 20H14c0-6 2-13 5-20l-4-5 3-8Z" />
        </Svg>
      );
    case 'Hauts':
      return (
        <Svg {...common}>
          <Path
            {...stroke}
            d="M17 8h4c0 2 1.4 3 3 3s3-1 3-3h4l7 6-4 6-3-2v20H17V18l-3 2-4-6 7-6Z"
          />
        </Svg>
      );
    case 'Bas':
      return (
        <Svg {...common}>
          <Path {...stroke} d="M16 8h16l2 32h-9l-1.5-20h-1L21 40h-9l4-32Z" />
        </Svg>
      );
    case 'Vestes':
      return (
        <Svg {...common}>
          <Path
            {...stroke}
            d="M18 8h12l7 6-4 6-3-2v22h-6l-.5-16h-3L20 40h-6V18l-3 2-4-6 7-6Z"
          />
          <Path {...stroke} d="M24 12v26" />
        </Svg>
      );
    case 'Accessoires':
    default:
      return (
        <Svg {...common}>
          <Path {...stroke} d="M14 20h20l3 18H11l3-18Z" />
          <Path {...stroke} d="M18 20v-3a6 6 0 0 1 12 0v3" />
          <Circle cx={24} cy={29} r={2} fill={color} />
        </Svg>
      );
  }
}
