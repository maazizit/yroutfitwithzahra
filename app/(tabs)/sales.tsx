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
import { LogoHeader } from '@/components/Logo';
import { ProductCard } from '@/components/ProductCard';
import { morphologyLabel } from '@/lib/morphology';
import { fetchProducts, privateSalesFeed } from '@/lib/products';
import { useProfile } from '@/lib/profile';
import type { Product } from '@/lib/types';
import { colors, radius, serif } from '@/theme';

export default function SalesScreen() {
  const { profile } = useProfile();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const feed = useMemo(
    () => (profile ? privateSalesFeed(products, profile) : []),
    [products, profile],
  );

  if (!profile) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <LogoHeader subtitle="Ventes privées" />
      </View>

      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>✨ Ventes Privées</Text>
        <Text style={styles.bannerText}>
          Jusqu'à -70 %, triées pour ta silhouette {morphologyLabel(profile.morphology)} et ton
          budget de {profile.budget} €.
        </Text>
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
                Pas de vente privée dans ton budget aujourd'hui.{'\n'}Reviens vite, ça change tous
                les jours ✨
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
  },
  banner: {
    marginHorizontal: 18,
    marginTop: 12,
    backgroundColor: colors.saleSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#EFCFCB',
    padding: 16,
    gap: 4,
  },
  bannerTitle: {
    fontFamily: serif,
    fontSize: 18,
    color: colors.sale,
  },
  bannerText: {
    fontSize: 13,
    color: colors.ink,
    lineHeight: 18,
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
  },
  emptyText: {
    fontFamily: serif,
    fontSize: 16,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 24,
  },
});
