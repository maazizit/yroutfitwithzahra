import type { Morphology } from './morphology';
import type { Gender, ProductGender } from './gender';

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
  /** Tailles disponibles (S, M, 38…) — vide si inconnu */
  sizes?: string[];
  /** Couleurs disponibles */
  colors?: string[];
  /** Femme, homme ou mixte (unisexe) */
  gender?: ProductGender;
}

export interface UserProfile {
  /** Genre des vêtements recherchés */
  gender: Gender;
  morphology: Morphology;
  budget: number;
  /** Mode Pudeur : n'afficher que des pièces couvrantes et amples */
  modestMode: boolean;
  /** Tailles préférées — vide = pas de filtre */
  clothingSizes: string[];
  /** Couleurs préférées — vide = pas de filtre */
  favoriteColors: string[];
}

export interface ShopFilterState {
  sizes: string[];
  colors: string[];
  /** Afficher uniquement les pièces taguées pour la morpho du profil */
  morphologyOnly?: boolean;
  /** Afficher uniquement les pièces pudiques / modestes */
  modestOnly?: boolean;
}

export interface DailyOutfit {
  top?: Product;
  bottom?: Product;
  jacket?: Product;
  dress?: Product;
  totalPrice: number;
}
