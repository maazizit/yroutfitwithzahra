import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FadeInView } from '@/components/anim';
import { LogoHeader } from '@/components/Logo';
import { ProductCard } from '@/components/ProductCard';
import { useFavorites } from '@/lib/favorites';
import { useResponsiveLayout } from '@/lib/layout';
import { fetchProducts } from '@/lib/products';
import { useProfile } from '@/lib/profile';
import { colors, radius, serif } from '@/theme';

export default function FavoritesScreen() {
  const { profile } = useProfile();
  const { ids, loading: favLoading } = useFavorites();
  const { pagePadding } = useResponsiveLayout();
  const [products, setProducts] = useState<Awaited<ReturnType<typeof fetchProducts>>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const favorites = useMemo(
    () => products.filter((p) => ids.has(p.id)),
    [products, ids],
  );

  if (!profile) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={[styles.header, { paddingHorizontal: pagePadding }]}>
        <LogoHeader compact subtitle="Tes coups de cœur" />
      </View>

      {loading || favLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.column}
          contentContainerStyle={[
            styles.list,
            { paddingHorizontal: pagePadding },
            favorites.length === 0 && styles.listEmpty,
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
          renderItem={({ item, index }) => (
            <FadeInView delay={Math.min(index, 6) * 70} dy={22} style={styles.cardSlot}>
              <ProductCard product={item} userMorphology={profile.morphology} />
            </FadeInView>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyIcon}>♡</Text>
              <Text style={styles.emptyTitle}>Aucun coup de cœur</Text>
              <Text style={styles.emptyText}>
                Appuie sur le cœur d&apos;une pièce dans « Pour toi » pour la retrouver ici.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ivory },
  header: {
    paddingTop: 10,
    paddingBottom: 8,
  },
  list: { paddingTop: 8, gap: 14, paddingBottom: 30 },
  listEmpty: { flexGrow: 1 },
  column: { gap: 14 },
  cardSlot: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 10,
  },
  emptyIcon: {
    fontSize: 42,
    color: colors.accentSoft,
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
    maxWidth: 280,
  },
});
