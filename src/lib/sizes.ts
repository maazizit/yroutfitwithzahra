/** Tailles proposées dans le profil et les filtres shop. */
export const SIZE_OPTIONS = [
  'Toutes',
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  '34',
  '36',
  '38',
  '40',
  '42',
  '44',
] as const;

export type SizeOption = (typeof SIZE_OPTIONS)[number];

const ALIASES: Record<string, string> = {
  XXS: 'XXS',
  XS: 'XS',
  S: 'S',
  M: 'M',
  L: 'L',
  XL: 'XL',
  XXL: 'XXL',
  '3XL': 'XXL',
  SMALL: 'S',
  MEDIUM: 'M',
  LARGE: 'L',
  XLARGE: 'XL',
  T0: 'XS',
  T1: 'S',
  T2: 'M',
  T3: 'L',
  T4: 'XL',
};

export function normalizeSize(raw: string): string {
  const trimmed = raw.trim().toUpperCase();
  return ALIASES[trimmed] ?? trimmed;
}

export function parseSizes(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  return [
    ...new Set(
      raw
        .split(/[,|/;]+/)
        .map((part) => normalizeSize(part))
        .filter(Boolean),
    ),
  ];
}

/** Extrait une taille depuis le titre produit (ex. « Robe midi — M »). */
export function inferSizesFromText(text: string): string[] {
  const found: string[] = [];
  const re = /\b(XXS|XS|S|M|L|XL|XXL|3XL|T[0-4]|3[2-9]|4[0-8])\b/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    found.push(normalizeSize(match[1]));
  }
  return [...new Set(found)];
}

/** Pas de taille choisie → pas de filtre. Produit sans tailles → toujours visible. */
export function matchesClothingSize(productSizes: string[], userSize: string | null | undefined): boolean {
  if (!userSize) return true;
  if (productSizes.length === 0) return true;
  const wanted = normalizeSize(userSize);
  return productSizes.some((size) => normalizeSize(size) === wanted);
}

export function sizeLabel(size: string | null | undefined): string {
  if (!size) return 'Toutes tailles';
  return `Taille ${size}`;
}
