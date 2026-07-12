import type { Morphology } from './morphology';

export type Category = 'Robes' | 'Hauts' | 'Bas' | 'Vestes' | 'Accessoires';

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  currency: string;
  image: string;
  url: string;
  /** Awin merchant id — présent quand la marque est reliée à ton compte affilié */
  awinMid?: string;
  tags: Morphology[];
  category: Category;
  /** Convient au mode pudeur (char3i) : couvrant, ample, opaque */
  modest?: boolean;
}

export interface UserProfile {
  morphology: Morphology;
  budget: number;
  /** Mode Pudeur : n'afficher que des pièces couvrantes et amples */
  modestMode: boolean;
}
