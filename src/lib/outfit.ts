import type { Category, DailyOutfit, Product, ShopFilterState, UserProfile } from './types';
import { matchesMorphology, shoppingFeed } from './products';

function daySeed(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function pickFrom<T>(items: T[], seed: number, salt: number): T | undefined {
  if (!items.length) return undefined;
  return items[(seed + salt) % items.length];
}

function byCategory(pool: Product[], category: Category): Product[] {
  return pool.filter((p) => p.category === category);
}

/** Tenue du jour : haut + bas + veste, ou robe (+ veste), selon morpho & budget. */
export function buildDailyOutfit(
  products: Product[],
  profile: UserProfile,
  shopFilters?: ShopFilterState,
): DailyOutfit | null {
  let pool = shoppingFeed(products, profile, shopFilters);
  if (!pool.length) return null;

  const morphoPool = pool.filter((p) => matchesMorphology(p, profile.morphology));
  if (morphoPool.length >= 2) pool = morphoPool;

  const seed = daySeed();
  const dresses = byCategory(pool, 'Robes');
  const tops = byCategory(pool, 'Hauts');
  const bottoms = byCategory(pool, 'Bas');
  const jackets = byCategory(pool, 'Vestes');

  if (dresses.length && (seed % 3 === 0 || (!tops.length && !bottoms.length))) {
    const dress = pickFrom(dresses, seed, 1);
    if (!dress) return null;
    const jacket = pickFrom(jackets, seed, 2);
    return {
      dress,
      jacket,
      totalPrice: dress.price + (jacket?.price ?? 0),
    };
  }

  const top = pickFrom(tops, seed, 3) ?? pickFrom(pool, seed, 7);
  const bottom = pickFrom(bottoms, seed, 4);
  const jacket = pickFrom(jackets, seed, 5);

  if (!top && !bottom) return null;

  return {
    top,
    bottom,
    jacket,
    totalPrice: (top?.price ?? 0) + (bottom?.price ?? 0) + (jacket?.price ?? 0),
  };
}
