export type Morphology = 'sablier' | 'poire' | 'pomme' | 'rectangle' | 'triangle_inverse';

export const ALL_MORPHOLOGIES: Morphology[] = [
  'sablier',
  'poire',
  'pomme',
  'rectangle',
  'triangle_inverse',
];

export interface MorphologyInfo {
  id: Morphology;
  label: string;
  tagline: string;
  advice: string[];
}

export const MORPHOLOGIES: MorphologyInfo[] = [
  {
    id: 'sablier',
    label: 'Sablier',
    tagline: 'Épaules et hanches alignées, taille marquée',
    advice: [
      'Pièces cintrées qui suivent la taille',
      'Robes portefeuille et ceintures fines',
      'Éviter les coupes trop amples qui cachent la taille',
    ],
  },
  {
    id: 'poire',
    label: 'Poire',
    tagline: 'Hanches plus larges que les épaules',
    advice: [
      'Hauts structurés, épaules soulignées',
      'Jupes évasées et pantalons droits foncés',
      'Couleurs claires en haut, sobres en bas',
    ],
  },
  {
    id: 'pomme',
    label: 'Pomme',
    tagline: 'Buste généreux, jambes fines',
    advice: [
      'Cols en V et matières fluides',
      'Coupes empire et vestes longilignes',
      'Mettre en valeur les jambes',
    ],
  },
  {
    id: 'rectangle',
    label: 'Rectangle',
    tagline: 'Silhouette longiligne, taille peu marquée',
    advice: [
      'Créer du volume : volants, péplums',
      'Ceintures pour dessiner la taille',
      'Superpositions et textures',
    ],
  },
  {
    id: 'triangle_inverse',
    label: 'Triangle inversé',
    tagline: 'Épaules plus larges que les hanches',
    advice: [
      'Volume en bas : jupes trapèze, pantalons larges',
      'Décolletés en V, hauts épurés',
      'Éviter les épaulettes',
    ],
  },
];

export function morphologyInfo(id: Morphology): MorphologyInfo {
  const found = MORPHOLOGIES.find((m) => m.id === id);
  return found ?? MORPHOLOGIES[0];
}

export function morphologyLabel(id: Morphology): string {
  return morphologyInfo(id).label;
}
