import React, { useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { buildPurchaseUrl, discountPercent, formatPrice } from '@/lib/affiliate';
import { morphologyLabel, type Morphology } from '@/lib/morphology';
import type { Product } from '@/lib/types';
import { colors, radius, serif, shadow } from '@/theme';

interface Props {
  product: Product;
  userMorphology: Morphology;
}

const BRAND_TINTS: Record<string, string> = {
  SHEIN: colors.blush,
  ZARA: colors.goldSoft,
  'H&M': colors.sageSoft,
  MANGO: colors.accentSoft,
};

export function ProductCard({ product, userMorphology }: Props) {
  const [imageFailed, setImageFailed] = useState(false);
  const discount = discountPercent(product);
  const ideal = product.tags.includes(userMorphology);
  const tint = BRAND_TINTS[product.brand] ?? colors.accentSoft;

  const openPurchase = () => {
    Linking.openURL(buildPurchaseUrl(product)).catch(() => {});
  };

  return (
    <View style={styles.card}>
      <View style={[styles.imageWrap, { backgroundColor: tint }]}>
        {!imageFailed && product.image ? (
          <Image
            source={{ uri: product.image }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
            accessibilityLabel={product.name}
          />
        ) : (
          <Text style={styles.imageFallback}>{product.brand.charAt(0)}</Text>
        )}
        {discount !== null && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discount}%</Text>
          </View>
        )}
        {ideal && (
          <View style={styles.morphoBadge}>
            <Text style={styles.morphoBadgeText}>
              ✓ Idéal pour Silhouette {morphologyLabel(userMorphology)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <Text style={styles.brand}>{product.brand}</Text>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(product.price, product.currency)}</Text>
          {product.originalPrice && discount !== null && (
            <Text style={styles.originalPrice}>
              {formatPrice(product.originalPrice, product.currency)}
            </Text>
          )}
        </View>
        <Pressable
          onPress={openPurchase}
          style={({ pressed }) => [styles.buyButton, pressed && styles.buyButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel={`Acheter ${product.name} chez ${product.brand}`}
        >
          <Text style={styles.buyText}>Acheter</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  imageWrap: {
    aspectRatio: 3 / 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    fontFamily: serif,
    fontSize: 44,
    color: colors.accent,
  },
  discountBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: colors.sale,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  discountText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  morphoBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  morphoBadgeText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: colors.accentDark,
    textAlign: 'center',
  },
  body: {
    padding: 12,
    gap: 4,
  },
  brand: {
    fontSize: 10.5,
    letterSpacing: 1.5,
    color: colors.muted,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  name: {
    fontFamily: serif,
    fontSize: 14.5,
    color: colors.ink,
    lineHeight: 19,
    minHeight: 38,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 2,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
  },
  originalPrice: {
    fontSize: 12.5,
    color: colors.faint,
    textDecorationLine: 'line-through',
  },
  buyButton: {
    marginTop: 8,
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingVertical: 10,
    alignItems: 'center',
  },
  buyButtonPressed: {
    backgroundColor: colors.accentDark,
  },
  buyText: {
    color: colors.white,
    fontSize: 13.5,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
});
