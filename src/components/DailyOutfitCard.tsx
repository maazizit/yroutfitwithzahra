import { AntDesign } from '@expo/vector-icons';
import React from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { FadeInView } from '@/components/anim';
import { buildPurchaseUrl, formatPrice } from '@/lib/affiliate';
import { morphologyLabel } from '@/lib/morphology';
import { shareOutfit } from '@/lib/share';
import type { DailyOutfit, Product } from '@/lib/types';
import type { Morphology } from '@/lib/morphology';
import { colors, radius, serif, shadow } from '@/theme';

interface Props {
  outfit: DailyOutfit;
  morphology: Morphology;
}

function MiniPiece({ product, role }: { product: Product; role: string }) {
  const open = () => Linking.openURL(buildPurchaseUrl(product)).catch(() => {});

  return (
    <Pressable style={styles.piece} onPress={open} accessibilityRole="button">
      <View style={styles.pieceImageWrap}>
        {product.image ? (
          <Image source={{ uri: product.image }} style={styles.pieceImage} resizeMode="cover" />
        ) : (
          <View style={styles.piecePlaceholder}>
            <Text style={styles.piecePlaceholderText}>{product.brand.slice(0, 2)}</Text>
          </View>
        )}
      </View>
      <Text style={styles.pieceRole}>{role}</Text>
      <Text style={styles.pieceName} numberOfLines={2}>
        {product.name}
      </Text>
      <Text style={styles.piecePrice}>{formatPrice(product.price, product.currency)}</Text>
    </Pressable>
  );
}

export function DailyOutfitCard({ outfit, morphology }: Props) {
  const pieces = [outfit.dress, outfit.top, outfit.bottom, outfit.jacket].filter(
    (p): p is Product => !!p,
  );

  const roles: Record<string, string> = {};
  if (outfit.dress) roles[outfit.dress.id] = 'Robe';
  if (outfit.top) roles[outfit.top.id] = 'Haut';
  if (outfit.bottom) roles[outfit.bottom.id] = 'Bas';
  if (outfit.jacket) roles[outfit.jacket.id] = 'Veste';

  return (
    <FadeInView delay={40} dy={10}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Look du jour</Text>
            <Text style={styles.title}>Pour ta silhouette {morphologyLabel(morphology)}</Text>
          </View>
          <View style={styles.totalBadge}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              {formatPrice(outfit.totalPrice, pieces[0]?.currency ?? 'EUR')}
            </Text>
          </View>
        </View>

        <View style={styles.piecesRow}>
          {pieces.map((p) => (
            <MiniPiece key={p.id} product={p} role={roles[p.id] ?? 'Pièce'} />
          ))}
        </View>

        <Pressable
          style={styles.shareBtn}
          onPress={() => shareOutfit(pieces, outfit.totalPrice, pieces[0]?.currency)}
          accessibilityRole="button"
          accessibilityLabel="Partager ce look"
        >
          <AntDesign name="sharealt" size={14} color={colors.white} />
          <Text style={styles.shareText}>Partager ce look</Text>
        </Pressable>
      </View>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 12,
    ...shadow.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  title: {
    fontFamily: serif,
    fontStyle: 'italic',
    fontSize: 17,
    color: colors.ink,
    marginTop: 2,
  },
  totalBadge: {
    backgroundColor: colors.goldSoft,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  totalValue: {
    fontFamily: serif,
    fontSize: 16,
    color: colors.ink,
  },
  piecesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  piece: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  pieceImageWrap: {
    aspectRatio: 3 / 4,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.goldSoft,
  },
  pieceImage: {
    width: '100%',
    height: '100%',
  },
  piecePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  piecePlaceholderText: {
    fontFamily: serif,
    fontSize: 18,
    color: colors.accent,
  },
  pieceRole: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.faint,
  },
  pieceName: {
    fontSize: 11,
    color: colors.ink,
    lineHeight: 14,
  },
  piecePrice: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accentDark,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingVertical: 11,
  },
  shareText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
});
