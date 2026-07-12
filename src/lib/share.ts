import { Platform, Share } from 'react-native';
import { buildPurchaseUrl, formatPrice } from './affiliate';
import type { Product } from './types';

export async function shareProduct(product: Product): Promise<boolean> {
  const url = buildPurchaseUrl(product);
  const price = formatPrice(product.price, product.currency);
  const message = [
    `✨ ${product.name}`,
    `${price} · ${product.brand}`,
    '',
    'Découvert sur YourOutfit with Zahra',
    url,
  ].join('\n');

  try {
    const result = await Share.share(
      Platform.OS === 'ios'
        ? { message, url, title: product.name }
        : { message, title: product.name },
    );
    return result.action === Share.sharedAction;
  } catch {
    return false;
  }
}

export async function shareOutfit(
  pieces: Product[],
  totalPrice: number,
  currency = 'EUR',
): Promise<boolean> {
  const lines = pieces.map((p) => `• ${p.name} — ${formatPrice(p.price, p.currency)}`);
  const links = pieces.map((p) => buildPurchaseUrl(p)).join('\n');
  const message = [
    '👗 Mon look du jour — YourOutfit with Zahra',
    '',
    ...lines,
    '',
    `Total : ${formatPrice(totalPrice, currency)}`,
    '',
    links,
  ].join('\n');

  try {
    const result = await Share.share({ message, title: 'Mon look du jour' });
    return result.action === Share.sharedAction;
  } catch {
    return false;
  }
}
