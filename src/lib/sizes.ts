/** Tailles — standard, numérique EU et curvy / plus-size. */
export const SIZE_GROUPS = [
  {
    title: 'Lettres',
    options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    title: 'Numérique EU',
    options: ['34', '36', '38', '40', '42', '44'],
  },
  {
    title: 'Curvy & Plus',
    options: ['46', '48', '50', '52', '3XL', '4XL', 'Curvy', 'Plus'],
  },
] as const;

export const ALL_SIZE_OPTIONS = SIZE_GROUPS.flatMap((g) => g.options);

const ALIASES: Record<string, string> = {
  XXS: 'XS',
  XS: 'XS',
  S: 'S',
  SMALL: 'S',
  M: 'M',
  MEDIUM: 'M',
  L: 'L',
  LARGE: 'L',
  XL: 'XL',
  XLARGE: 'XL',
  XXL: 'XXL',
  '2XL': 'XXL',
  '3XL': '3XL',
  '4XL': '4XL',
  XXXL: '3XL',
  XXXXL: '4XL',
  T0: 'XS',
  T1: 'S',
  T2: 'M',
  T3: 'L',
  T4: 'XL',
  CURVY: 'Curvy',
  'PLUS SIZE': 'Plus',
  PLUS: 'Plus',
  'PLUS-SIZE': 'Plus',
};

export function normalizeSize(raw: string): string {
  const s = raw.trim().toUpperCase();
  return ALIASES[s] ?? s;
}

export function parseSizes(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  return [
    ...new Set(
      raw
        .split(/[,|/;\-–]+/)
        .map((part) => normalizeSize(part))
        .filter(Boolean),
    ),
  ];
}

export function inferSizesFromText(text: string): string[] {
  const found: string[] = [];
  const re =
    /\b(XXS|XS|S|M|L|XL|XXL|2XL|3XL|4XL|Curvy|Plus|Plus Size|T[0-4]|3[4-9]|4[0-8]|5[0-2])\b/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    found.push(normalizeSize(match[1]));
  }
  return [...new Set(found)];
}

/** Multi-select : aucune sélection = tout afficher. */
export function matchesClothingSizes(productSizes: string[], selected: string[]): boolean {
  if (selected.length === 0) return true;
  if (productSizes.length === 0) return true;
  const wanted = new Set(selected.map(normalizeSize));
  return productSizes.some((size) => wanted.has(normalizeSize(size)));
}

/** @deprecated compat — préférer matchesClothingSizes */
export function matchesClothingSize(
  productSizes: string[],
  userSize: string | null | undefined,
): boolean {
  if (!userSize) return true;
  return matchesClothingSizes(productSizes, [userSize]);
}

export function sizesSummary(selected: string[]): string {
  if (selected.length === 0) return 'Toutes';
  if (selected.length === 1) return selected[0];
  return `${selected.length} tailles`;
}
