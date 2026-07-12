import { discountPercent } from './affiliate';
import { isClothingProduct, isLikelyGiftOrSample } from './catalog';
import { matchesColors } from './colors';
import { inferProductGender, matchesGender, type ProductGender } from './gender';
import type { Morphology } from './morphology';
import { ALL_MORPHOLOGIES } from './morphology';
import { matchesClothingSizes } from './sizes';
import { supabase } from './supabase';
import type { Category, Product, ShopFilterState, UserProfile } from './types';

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
  sizes: string[] | null;
  colours: string[] | null;
  gender: string | null;
}

function rowToProduct(row: ProductRow): Product | null {
  if (isLikelyGiftOrSample(row.name, Number(row.price))) return null;
  if (!isClothingProduct(row.name, row.category ?? undefined)) return null;

  const tags = (row.tags ?? []).filter((t): t is Morphology =>
    (ALL_MORPHOLOGIES as string[]).includes(t),
  );
  const category = CATEGORIES.includes(row.category as Category)
    ? (row.category as Category)
    : 'Hauts';
  const genderRaw = row.gender as ProductGender | null;
  const gender: ProductGender =
    genderRaw === 'femme' || genderRaw === 'homme' || genderRaw === 'mixte'
      ? genderRaw
      : inferProductGender(`${row.name} ${row.category ?? ''}`);
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
    sizes: row.sizes?.length ? row.sizes.map((s) => s.trim()).filter(Boolean) : [],
    colors: row.colours?.length ? row.colours.map((c) => c.trim()).filter(Boolean) : [],
    gender,
  };
}

const FETCH_TIMEOUT_MS = 10000;

export async function fetchProducts(): Promise<Product[]> {
  try {
    const query = supabase.from('products').select('*').limit(500);
    const timeout = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), FETCH_TIMEOUT_MS),
    );
    const result = await Promise.race([query, timeout]);
    if (!result || result.error || !result.data) return [];
    return (result.data as ProductRow[])
      .map(rowToProduct)
      .filter((p): p is Product => p !== null);
  } catch {
    return [];
  }
}

export function matchesMorphology(product: Product, morphology: Morphology): boolean {
  return product.tags.includes(morphology);
}

function respectsModesty(product: Product, profile: UserProfile): boolean {
  return !profile.modestMode || product.modest === true;
}

function mergeFilters(profile: UserProfile, shop?: ShopFilterState): ShopFilterState {
  return {
    sizes: shop?.sizes.length ? shop.sizes : profile.clothingSizes,
    colors: shop?.colors.length ? shop.colors : profile.favoriteColors,
  };
}

function passesFilters(product: Product, filters: ShopFilterState): boolean {
  return (
    matchesClothingSizes(product.sizes ?? [], filters.sizes) &&
    matchesColors(product.colors ?? [], filters.colors)
  );
}

function passesShopToggles(product: Product, profile: UserProfile, shopFilters?: ShopFilterState): boolean {
  if (shopFilters?.morphologyOnly && !matchesMorphology(product, profile.morphology)) return false;
  if (shopFilters?.modestOnly && product.modest !== true) return false;
  return true;
}

/** Flux principal : vêtements uniquement, budget, pudeur, tailles/couleurs, morpho en tête. */
export function shoppingFeed(
  products: Product[],
  profile: UserProfile,
  shopFilters?: ShopFilterState,
): Product[] {
  const filters = mergeFilters(profile, shopFilters);
  return products
    .filter(
      (p) =>
        p.price > 0 &&
        p.price <= profile.budget &&
        matchesGender(p.gender, profile.gender) &&
        respectsModesty(p, profile) &&
        passesFilters(p, filters) &&
        passesShopToggles(p, profile, shopFilters),
    )
    .sort((a, b) => {
      const ma = matchesMorphology(a, profile.morphology) ? 1 : 0;
      const mb = matchesMorphology(b, profile.morphology) ? 1 : 0;
      if (ma !== mb) return mb - ma;
      return a.price - b.price;
    });
}

export function privateSalesFeed(
  products: Product[],
  profile: UserProfile,
  shopFilters?: ShopFilterState,
): Product[] {
  const filters = mergeFilters(profile, shopFilters);
  return products
    .filter(
      (p) =>
        (discountPercent(p) ?? 0) >= 30 &&
        p.price > 0 &&
        p.price <= profile.budget &&
        matchesGender(p.gender, profile.gender) &&
        respectsModesty(p, profile) &&
        passesFilters(p, filters) &&
        passesShopToggles(p, profile, shopFilters),
    )
    .sort((a, b) => {
      const ma = matchesMorphology(a, profile.morphology) ? 1 : 0;
      const mb = matchesMorphology(b, profile.morphology) ? 1 : 0;
      if (ma !== mb) return mb - ma;
      return (discountPercent(b) ?? 0) - (discountPercent(a) ?? 0);
    });
}
