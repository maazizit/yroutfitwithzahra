import { AntDesign } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Animated, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { buildPurchaseUrl, discountPercent, formatPrice } from '@/lib/affiliate';
import { morphologyLabel, type Morphology } from '@/lib/morphology';
import type { Product } from '@/lib/types';
import { colors, radius, serif, shadow } from '@/theme';
import { ScalePressable, usePopAnimation } from './anim';
import { CategoryIcon } from './CategoryIcon';

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

/**
 * Bouton d'achat interactif : au clic il se transforme (couleur sauge,
 * coche animée, « On y va ! ») puis ouvre la boutique.
 */
function BuyButton({ onBuy, accessibilityLabel }: { onBuy: () => void; accessibilityLabel: string }) {
  const [done, setDone] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const checkScale = usePopAnimation(done);

  const backgroundColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.ink, '#6FA97A'],
  });

  const handlePress = () => {
    if (done) return;
    setDone(true);
    Animated.timing(progress, { toValue: 1, duration: 260, useNativeDriver: false }).start();
    setTimeout(onBuy, 420);
    setTimeout(() => {
      Animated.timing(progress, { toValue: 0, duration: 320, useNativeDriver: false }).start(() =>
        setDone(false),
      );
    }, 2000);
  };

  return (
    <Pressable onPress={handlePress} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
      <Animated.View style={[styles.buyButton, { backgroundColor }]}>
        {done ? (
          <>
            <Animated.View style={{ transform: [{ scale: checkScale }] }}>
              <AntDesign name="check" size={15} color={colors.white} />
            </Animated.View>
            <Text style={styles.buyText}>On y va !</Text>
          </>
        ) : (
          <>
            <Text style={styles.buyText}>Acheter</Text>
            <Text style={styles.buyArrow}>→</Text>
          </>
        )}
      </Animated.View>
    </Pressable>
  );
}

export function ProductCard({ product, userMorphology }: Props) {
  const [imageFailed, setImageFailed] = useState(false);
  const [liked, setLiked] = useState(false);
  const imageOpacity = useRef(new Animated.Value(0)).current;
  const heartScale = usePopAnimation(liked);

  const discount = discountPercent(product);
  const ideal = product.tags.includes(userMorphology);
  const tint = BRAND_TINTS[product.brand] ?? colors.accentSoft;

  const openPurchase = () => {
    Linking.openURL(buildPurchaseUrl(product)).catch(() => {});
  };

  return (
    <ScalePressable style={styles.card} pressedScale={0.975} onPress={openPurchase} hoverLift>
      <View style={[styles.imageWrap, { backgroundColor: tint }]}>
        {!imageFailed && product.image ? (
          <Animated.View style={[styles.imageFill, { opacity: imageOpacity }]}>
            <Image
              source={{ uri: product.image }}
              style={styles.imageFill}
              resizeMode="cover"
              onError={() => setImageFailed(true)}
              onLoad={() =>
                Animated.timing(imageOpacity, {
                  toValue: 1,
                  duration: 420,
                  useNativeDriver: true,
                }).start()
              }
              accessibilityLabel={product.name}
            />
          </Animated.View>
        ) : (
          <View style={styles.placeholder}>
            <CategoryIcon category={product.category} size={52} color={colors.accent} />
            <Text style={styles.placeholderBrand}>{product.brand}</Text>
            <Text style={styles.placeholderNote}>Photo à venir avec le flux Awin</Text>
          </View>
        )}

        {discount !== null && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discount}%</Text>
          </View>
        )}

        {product.modest && (
          <View style={[styles.modestBadge, discount !== null && styles.modestBadgeShifted]}>
            <Text style={styles.modestText}>🧕 Pudique</Text>
          </View>
        )}

        <Pressable
          onPress={() => setLiked((v) => !v)}
          hitSlop={10}
          style={styles.heartButton}
          accessibilityRole="button"
          accessibilityLabel={liked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <AntDesign
              name={liked ? 'heart' : 'hearto'}
              size={16}
              color={liked ? colors.sale : colors.ink}
            />
          </Animated.View>
        </Pressable>

        {ideal && (
          <View style={styles.morphoBadge}>
            <Text style={styles.morphoBadgeText}>
              ✓ Idéal pour Silhouette {morphologyLabel(userMorphology)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.brandRow}>
          <Text style={styles.brand}>{product.brand}</Text>
          <View style={styles.brandLine} />
        </View>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        {product.sizes && product.sizes.length > 0 && (
          <Text style={styles.sizes}>{product.sizes.slice(0, 4).join(' · ')}</Text>
        )}
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(product.price, product.currency)}</Text>
          {product.originalPrice && discount !== null && (
            <Text style={styles.originalPrice}>
              {formatPrice(product.originalPrice, product.currency)}
            </Text>
          )}
        </View>
        <BuyButton
          onBuy={openPurchase}
          accessibilityLabel={`Acheter ${product.name} chez ${product.brand}`}
        />
      </View>
    </ScalePressable>
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
  imageFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
  },
  placeholderBrand: {
    fontFamily: serif,
    fontSize: 15,
    letterSpacing: 2,
    color: colors.accentDark,
  },
  placeholderNote: {
    fontSize: 9.5,
    color: colors.muted,
    textAlign: 'center',
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
  modestBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: colors.sageSoft,
    borderWidth: 1,
    borderColor: colors.sage,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  modestBadgeShifted: {
    top: 38,
  },
  modestText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#4E6147',
  },
  heartButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
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
    borderWidth: 1,
    borderColor: colors.goldSoft,
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
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brand: {
    fontSize: 10.5,
    letterSpacing: 1.5,
    color: colors.muted,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  brandLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.goldSoft,
  },
  name: {
    fontFamily: serif,
    fontSize: 14.5,
    color: colors.ink,
    lineHeight: 19,
    minHeight: 38,
  },
  sizes: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '600',
    marginTop: -4,
    marginBottom: 2,
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
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  buyText: {
    color: colors.white,
    fontSize: 13.5,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  buyArrow: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: '700',
  },
});
