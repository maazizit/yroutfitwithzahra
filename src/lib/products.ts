import { SAMPLE_PRODUCTS } from '@/data/sample-products';
import { discountPercent } from './affiliate';
import type { Morphology } from './morphology';
import { ALL_MORPHOLOGIES } from './morphology';
import { supabase } from './supabase';
import type { Category, Product, UserProfile } from './types';

const CATEGORIES: Category[] = ['Robes', 'Hauts', 'Bas', 'Vestes', 'Accessoires'];

interface ProductRow {
  id: string;
  name: string;
  brand: string;
  price: number;
  original_price: number | null;
  currency: string | null;
  image: string | null;
  url: string;
  awin_mid: string | null;
  tags: string[] | null;
  category: string | null;
  modest: boolean | null;
}

function rowToProduct(row: ProductRow): Product {
  const tags = (row.tags ?? []).filter((t): t is Morphology =>
    (ALL_MORPHOLOGIES as string[]).includes(t),
  );
  const category = CATEGORIES.includes(row.category as Category)
    ? (row.category as Category)
    : 'Hauts';
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    price: Number(row.price),
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    currency: row.currency ?? 'EUR',
    image: row.image ?? '',
    url: row.url,
    awinMid: row.awin_mid ?? undefined,
    tags,
    category,
    modest: row.modest === true,
  };
}

const FETCH_TIMEOUT_MS = 4000;

/**
 * Charge le catalogue : d'abord la table Supabase `products`
 * (remplie par le cron du flux Awin), sinon le catalogue de démonstration.
 * Si le réseau traîne (> 4 s), on affiche le catalogue de démonstration
 * plutôt que de laisser l'utilisatrice devant un spinner.
 */
export async function fetchProducts(): Promise<Product[]> {
  try {
    const query = supabase.from('products').select('*').limit(200);
    const timeout = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), FETCH_TIMEOUT_MS),
    );
    const result = await Promise.race([query, timeout]);
    if (!result || result.error || !result.data || result.data.length === 0) {
      return SAMPLE_PRODUCTS;
    }
    return (result.data as ProductRow[]).map(rowToProduct);
  } catch {
    return SAMPLE_PRODUCTS;
  }
}

export function matchesMorphology(product: Product, morphology: Morphology): boolean {
  return product.tags.includes(morphology);
}

/** Mode Pudeur : uniquement les pièces couvrantes et amples. */
function respectsModesty(product: Product, profile: UserProfile): boolean {
  return !profile.modestMode || product.modest === true;
}

/** Flux principal : dans le budget, articles compatibles morpho en premier, puis prix croissant. */
export function shoppingFeed(products: Product[], profile: UserProfile): Product[] {
  return products
    .filter((p) => p.price <= profile.budget && respectsModesty(p, profile))
    .sort((a, b) => {
      const ma = matchesMorphology(a, profile.morphology) ? 1 : 0;
      const mb = matchesMorphology(b, profile.morphology) ? 1 : 0;
      if (ma !== mb) return mb - ma;
      return a.price - b.price;
    });
}

/** Ventes privées : remise ≥ 30 %, triées par compatibilité morpho puis remise décroissante. */
export function privateSalesFeed(products: Product[], profile: UserProfile): Product[] {
  return products
    .filter(
      (p) =>
        (discountPercent(p) ?? 0) >= 30 && p.price <= profile.budget && respectsModesty(p, profile),
    )
    .sort((a, b) => {
      const ma = matchesMorphology(a, profile.morphology) ? 1 : 0;
      const mb = matchesMorphology(b, profile.morphology) ? 1 : 0;
      if (ma !== mb) return mb - ma;
      return (discountPercent(b) ?? 0) - (discountPercent(a) ?? 0);
    });
}
