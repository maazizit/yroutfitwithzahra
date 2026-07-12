import { Platform } from 'react-native';

/**
 * Design system — "Minimalisme chic"
 * Palette claire, tons neutres chauds + terracotta doux + or discret.
 */
export const colors = {
  ivory: '#FBF8F3',
  card: '#FFFFFF',
  ink: '#26221B',
  muted: '#8D857A',
  faint: '#B8B0A4',
  accent: '#B76E5D',
  accentDark: '#9A5748',
  accentSoft: '#F5E7E2',
  gold: '#C6A15B',
  goldSoft: '#F4EBDA',
  blush: '#EFD9D3',
  sage: '#A8B5A0',
  sageSoft: '#EDF1EA',
  border: '#EDE6DB',
  sale: '#B3453F',
  saleSoft: '#F8E4E2',
  white: '#FFFFFF',
} as const;

export const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  pill: 999,
} as const;

export const shadow = {
  card: {
    shadowColor: '#3E362A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 22,
    elevation: 5,
  },
  float: {
    shadowColor: '#3E362A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 10,
  },
} as const;

export const spacing = (n: number) => n * 4;
