export interface ColorOption {
  id: string;
  label: string;
  swatch: string;
}

export const COLOR_OPTIONS: ColorOption[] = [
  { id: 'noir', label: 'Noir', swatch: '#1C1C1C' },
  { id: 'blanc', label: 'Blanc', swatch: '#F7F5F0' },
  { id: 'beige', label: 'Beige', swatch: '#D4C4A8' },
  { id: 'camel', label: 'Camel', swatch: '#C19A6B' },
  { id: 'marron', label: 'Marron', swatch: '#6B4F3A' },
  { id: 'rouge', label: 'Rouge', swatch: '#9B2335' },
  { id: 'rose', label: 'Rose', swatch: '#E8B4B8' },
  { id: 'corail', label: 'Corail', swatch: '#E07A5F' },
  { id: 'orange', label: 'Orange', swatch: '#D97706' },
  { id: 'jaune', label: 'Jaune', swatch: '#E9C46A' },
  { id: 'vert', label: 'Vert', swatch: '#6B8E6B' },
  { id: 'bleu', label: 'Bleu', swatch: '#4A6FA5' },
  { id: 'bleu-marine', label: 'Marine', swatch: '#1E3A5F' },
  { id: 'violet', label: 'Violet', swatch: '#7B6B8D' },
  { id: 'gris', label: 'Gris', swatch: '#9CA3AF' },
  { id: 'dore', label: 'Doré', swatch: '#C6A15B' },
  { id: 'multicolore', label: 'Multicolore', swatch: '#B76E5D' },
];

const ALIASES: Record<string, string> = {
  black: 'noir',
  white: 'blanc',
  ivory: 'blanc',
  cream: 'beige',
  beige: 'beige',
  nude: 'beige',
  tan: 'camel',
  camel: 'camel',
  brown: 'marron',
  chocolate: 'marron',
  red: 'rouge',
  burgundy: 'rouge',
  pink: 'rose',
  fuchsia: 'rose',
  coral: 'corail',
  orange: 'orange',
  yellow: 'jaune',
  green: 'vert',
  olive: 'vert',
  blue: 'bleu',
  navy: 'bleu-marine',
  'bleu marine': 'bleu-marine',
  purple: 'violet',
  lilac: 'violet',
  grey: 'gris',
  gray: 'gris',
  silver: 'gris',
  gold: 'dore',
  golden: 'dore',
  multicolor: 'multicolore',
  multi: 'multicolore',
};

export function normalizeColor(raw: string): string {
  const key = raw.trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  if (ALIASES[key]) return ALIASES[key];
  const match = COLOR_OPTIONS.find((c) => c.id === key || c.label.toLowerCase() === key);
  return match?.id ?? key;
}

export function parseColors(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  return [...new Set(raw.split(/[,|/;]+/).map((p) => normalizeColor(p)).filter(Boolean))];
}

export function inferColorsFromText(text: string): string[] {
  const found: string[] = [];
  const lower = text.toLowerCase();
  for (const opt of COLOR_OPTIONS) {
    if (lower.includes(opt.label.toLowerCase()) || lower.includes(opt.id)) {
      found.push(opt.id);
    }
  }
  for (const [alias, id] of Object.entries(ALIASES)) {
    if (lower.includes(alias)) found.push(id);
  }
  return [...new Set(found)];
}

export function matchesColors(productColors: string[], selected: string[]): boolean {
  if (selected.length === 0) return true;
  if (productColors.length === 0) return true;
  const wanted = new Set(selected.map(normalizeColor));
  return productColors.some((c) => wanted.has(normalizeColor(c)));
}

export function colorLabel(id: string): string {
  return COLOR_OPTIONS.find((c) => c.id === id)?.label ?? id;
}

export function colorSwatch(id: string): string {
  return COLOR_OPTIONS.find((c) => c.id === id)?.swatch ?? '#8D857A';
}

export function colorsSummary(selected: string[]): string {
  if (selected.length === 0) return 'Toutes';
  if (selected.length === 1) return colorLabel(selected[0]);
  return `${selected.length} couleurs`;
}
