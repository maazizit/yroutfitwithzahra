import { LinearGradient } from 'expo-linear-gradient';
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
import { FadeInView, PulseView } from '@/components/anim';
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

      <FadeInView delay={40} dy={12}>
        <LinearGradient
          colors={[colors.saleSoft, colors.goldSoft]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          <View style={styles.bannerRow}>
            <PulseView minScale={1} maxScale={1.25} duration={800}>
              <Text style={styles.bannerSpark}>✨</Text>
            </PulseView>
            <Text style={styles.bannerTitle}>Ventes Privées</Text>
          </View>
          <Text style={styles.bannerText}>
            Jusqu'à -70 %, triées pour ta silhouette {morphologyLabel(profile.morphology)} et ton
            budget de {profile.budget} €.
          </Text>
        </LinearGradient>
      </FadeInView>

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
          renderItem={({ item, index }) => (
            <FadeInView delay={Math.min(index, 6) * 70} dy={22} style={styles.cardSlot}>
              <ProductCard product={item} userMorphology={profile.morphology} />
            </FadeInView>
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
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#EFCFCB',
    padding: 16,
    gap: 4,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerSpark: {
    fontSize: 16,
  },
  bannerTitle: {
    fontFamily: serif,
    fontSize: 18,
    color: colors.sale,
  },
  cardSlot: {
    flex: 1,
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
