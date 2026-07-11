import type { Product } from './types';

/** Ton identifiant publisher Awin */
export const AWIN_AFFILIATE_ID = '2982087';

/**
 * Construit le lien d'achat.
 * - Marque reliée sur Awin (awinMid présent) → deeplink affilié traqué (commission).
 * - Sinon → lien direct vers la boutique (aucune commission, mais l'achat reste possible).
 */
export function buildPurchaseUrl(product: Product): string {
  if (product.awinMid) {
    const ued = encodeURIComponent(product.url);
    return `https://www.awin1.com/cread.php?awinmid=${product.awinMid}&awinaffid=${AWIN_AFFILIATE_ID}&ued=${ued}`;
  }
  return product.url;
}

export function discountPercent(product: Product): number | null {
  if (!product.originalPrice || product.originalPrice <= product.price) return null;
  return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
}

export function formatPrice(value: number, currency: string): string {
  const symbol = currency === 'EUR' ? '€' : currency === 'MAD' ? 'DH' : currency;
  return `${value.toFixed(2).replace('.', ',')} ${symbol}`;
}
