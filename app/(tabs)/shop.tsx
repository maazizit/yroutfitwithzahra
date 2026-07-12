import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DailyOutfitCard } from '@/components/DailyOutfitCard';
import { FadeInView } from '@/components/anim';
import { FilterChips } from '@/components/FilterChips';
import { LogoHeader } from '@/components/Logo';
import { ProductCard } from '@/components/ProductCard';
import { ShopFilterBar } from '@/components/ShopFilterBar';
import { ShopToggles } from '@/components/ShopToggles';
import { colorsSummary } from '@/lib/colors';
import { buildDailyOutfit } from '@/lib/outfit';
import { genderLabel } from '@/lib/gender';
import { morphologyLabel } from '@/lib/morphology';
import { fetchProducts, shoppingFeed } from '@/lib/products';
import { useProfile } from '@/lib/profile';
import { useResponsiveLayout } from '@/lib/layout';
import { sizesSummary } from '@/lib/sizes';
import type { Category, ShopFilterState } from '@/lib/types';
import { colors, radius, serif, shadow } from '@/theme';

const CATEGORY_FILTERS: Array<Category | 'Tous'> = [
  'Tous',
  'Robes',
  'Hauts',
  'Bas',
  'Vestes',
  'Accessoires',
];

export default function ShopScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const { contentWidth, pagePadding } = useResponsiveLayout();
  const [products, setProducts] = useState<Awaited<ReturnType<typeof fetchProducts>>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState<Category | 'Tous'>('Tous');
  const [shopFilters, setShopFilters] = useState<ShopFilterState>({
    sizes: [],
    colors: [],
    morphologyOnly: false,
    modestOnly: false,
  });

  const load = useCallback(async () => {
    setProducts(await fetchProducts());
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const feed = useMemo(() => {
    if (!profile) return [];
    const base = shoppingFeed(products, profile, shopFilters);
    return category === 'Tous' ? base : base.filter((p) => p.category === category);
  }, [products, profile, category, shopFilters]);

  const dailyOutfit = useMemo(() => {
    if (!profile || category !== 'Tous') return null;
    return buildDailyOutfit(products, profile, shopFilters);
  }, [products, profile, shopFilters, category]);

  if (!profile) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>Commence par créer ton profil de style.</Text>
          <Pressable style={styles.emptyCta} onPress={() => router.replace('/onboarding')}>
            <Text style={styles.emptyCtaText}>Créer mon profil</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const hasActiveShopFilters =
    shopFilters.sizes.length > 0 ||
    shopFilters.colors.length > 0 ||
    shopFilters.morphologyOnly === true ||
    shopFilters.modestOnly === true;

  const resetFilters = () =>
    setShopFilters({ sizes: [], colors: [], morphologyOnly: false, modestOnly: false });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FadeInView delay={0} dy={6}>
        <View style={[styles.headerCard, { marginHorizontal: pagePadding, maxWidth: contentWidth, alignSelf: 'center', width: '100%' }]}>
          <LinearGradient
            colors={[colors.ivory, colors.goldSoft]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <LogoHeader compact subtitle="Sublime ta forme" />

            <Pressable
              style={styles.profileRow}
              onPress={() => router.push('/(tabs)/profile')}
              accessibilityRole="button"
            >
              <View style={styles.profileInfo}>
                <Text style={styles.profileLabel}>Mon style</Text>
                <Text style={styles.profileValue} numberOfLines={1}>
                  {profile.modestMode ? '🧕 ' : ''}
                  {genderLabel(profile.gender)} · {morphologyLabel(profile.morphology)} · ≤ {profile.budget} €
                </Text>
              </View>
              <Text style={styles.profileChevron}>›</Text>
            </Pressable>

            <View style={styles.selectionCard}>
              <View style={styles.selectionText}>
                <Text style={styles.selectionEyebrow}>Ta sélection</Text>
                <Text style={styles.selectionTitle}>{morphologyLabel(profile.morphology)}</Text>
              </View>
              <View style={styles.countBadge}>
                <Text style={styles.countNum}>{feed.length}</Text>
                <Text style={styles.countLabel}>pièce{feed.length !== 1 ? 's' : ''}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      </FadeInView>

      <ShopFilterBar
        sizes={shopFilters.sizes}
        colors={shopFilters.colors}
        onChangeSizes={(sizes) => setShopFilters((f) => ({ ...f, sizes }))}
        onChangeColors={(colors) => setShopFilters((f) => ({ ...f, colors: colors }))}
      />

      <ShopToggles
        morphology={profile.morphology}
        morphologyOnly={shopFilters.morphologyOnly === true}
        modestOnly={shopFilters.modestOnly === true}
        profileModestMode={profile.modestMode}
        onMorphologyOnlyChange={(v) => setShopFilters((f) => ({ ...f, morphologyOnly: v }))}
        onModestOnlyChange={(v) => setShopFilters((f) => ({ ...f, modestOnly: v }))}
      />

      <View style={styles.filtersWrap}>
        <FilterChips
          label="Catégories"
          options={CATEGORY_FILTERS}
          value={category}
          onChange={setCategory}
          horizontalPadding={pagePadding}
        />
      </View>

      {!hasActiveShopFilters &&
        (profile.clothingSizes.length > 0 || profile.favoriteColors.length > 0) && (
          <Text style={styles.profileHint}>
            Profil : {sizesSummary(profile.clothingSizes)} · {colorsSummary(profile.favoriteColors)}
          </Text>
        )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : (
        <FlatList
          data={feed}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.column}
          contentContainerStyle={[styles.list, { paddingHorizontal: pagePadding }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
          ListHeaderComponent={
            dailyOutfit ? (
              <View style={styles.outfitHeader}>
                <DailyOutfitCard outfit={dailyOutfit} morphology={profile.morphology} />
              </View>
            ) : null
          }
          renderItem={({ item, index }) => (
            <FadeInView delay={Math.min(index, 6) * 70} dy={22} style={styles.cardSlot}>
              <ProductCard product={item} userMorphology={profile.morphology} />
            </FadeInView>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyTitle}>Aucun vêtement trouvé</Text>
              <Text style={styles.emptyText}>
                {products.length === 0
                  ? 'Importe un flux mode Awin (Bodycross, lingerie…), puis tire pour rafraîchir.'
                  : shopFilters.morphologyOnly
                    ? 'Aucune pièce taguée pour ta silhouette. Désactive « Silhouette » ou importe plus de flux.'
                    : 'Essaye « Effacer » les filtres, change de catégorie, ou augmente ton budget dans Mon style.'}
              </Text>
              {hasActiveShopFilters && (
                <Pressable style={styles.emptyCta} onPress={resetFilters}>
                  <Text style={styles.emptyCtaText}>Effacer mes filtres</Text>
                </Pressable>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ivory },
  headerCard: {
    marginTop: 6,
    marginBottom: 2,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.float,
  },
  headerGradient: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 10,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  profileLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.faint,
  },
  profileValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
  },
  profileChevron: {
    fontSize: 22,
    color: colors.accent,
    marginLeft: 8,
    lineHeight: 24,
  },
  selectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.goldSoft,
  },
  selectionText: {
    flex: 1,
    gap: 2,
  },
  selectionEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  selectionTitle: {
    fontFamily: serif,
    fontStyle: 'italic',
    fontSize: 18,
    color: colors.ink,
    lineHeight: 24,
  },
  countBadge: {
    alignItems: 'center',
    backgroundColor: colors.goldSoft,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 64,
  },
  countNum: {
    fontFamily: serif,
    fontSize: 22,
    color: colors.ink,
    lineHeight: 26,
  },
  countLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  filtersWrap: { marginTop: 2 },
  outfitHeader: {
    marginBottom: 14,
    width: '100%',
  },
  profileHint: {
    fontSize: 11.5,
    color: colors.faint,
    textAlign: 'center',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  cardSlot: { flex: 1 },
  list: { paddingTop: 14, gap: 14, paddingBottom: 30 },
  column: { gap: 14 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: serif,
    fontSize: 20,
    color: colors.ink,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: serif,
    fontSize: 15,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyCta: {
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 8,
  },
  emptyCtaText: { color: colors.white, fontWeight: '600' },
});
