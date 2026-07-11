import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogoHeader } from '@/components/Logo';
import { ProductCard } from '@/components/ProductCard';
import { morphologyLabel } from '@/lib/morphology';
import { fetchProducts, shoppingFeed } from '@/lib/products';
import { useProfile } from '@/lib/profile';
import type { Category, Product } from '@/lib/types';
import { colors, radius, serif } from '@/theme';

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
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState<Category | 'Tous'>('Tous');

  const load = useCallback(async () => {
    const all = await fetchProducts();
    setProducts(all);
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
    const base = shoppingFeed(products, profile);
    return category === 'Tous' ? base : base.filter((p) => p.category === category);
  }, [products, profile, category]);

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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <LogoHeader subtitle="Sublime ta forme" />
        <View style={styles.profilePill}>
          <Text style={styles.profilePillText}>
            {morphologyLabel(profile.morphology)} · ≤ {profile.budget} €
          </Text>
        </View>
      </View>

      <View style={styles.filtersWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {CATEGORY_FILTERS.map((c) => {
            const active = category === c;
            return (
              <Pressable
                key={c}
                onPress={() => setCategory(c)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{c}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

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
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
          renderItem={({ item }) => (
            <ProductCard product={item} userMorphology={profile.morphology} />
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>
                Aucun article dans ce budget pour l'instant.{'\n'}Augmente ton budget dans « Mon
                style ».
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.ivory,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profilePill: {
    backgroundColor: colors.goldSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  profilePillText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.ink,
  },
  filtersWrap: {
    marginTop: 10,
  },
  filters: {
    paddingHorizontal: 18,
    gap: 8,
  },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  chipText: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: '500',
  },
  chipTextActive: {
    color: colors.white,
  },
  list: {
    padding: 14,
    gap: 14,
    paddingBottom: 30,
  },
  column: {
    gap: 14,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 14,
  },
  emptyText: {
    fontFamily: serif,
    fontSize: 16,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 24,
  },
  emptyCta: {
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyCtaText: {
    color: colors.white,
    fontWeight: '600',
  },
});
