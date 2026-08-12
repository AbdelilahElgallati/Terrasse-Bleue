import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNav } from '@/components/BottomNav';
import { CategoryCard } from '@/components/CategoryCard';
import { ProductCard } from '@/components/ProductCard';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateViews';
import { useMenu } from '@/api/menu';
import { useCartStore } from '@/store/cart-store';
import { colors } from '@/theme/colors';

export default function MenuScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const [selected, setSelected] = useState(params.category ?? 'all');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addItem = useCartStore((state) => state.addItem);
  const menu = useMenu();
  const categories = menu.categories.data ?? [];
  const products = menu.products.data ?? [];
  const visible = selected === 'all' ? products : products.filter((product) => product.categoryId === selected);
  if (menu.isLoading) return <View style={[styles.page, { paddingTop: insets.top }]}><LoadingState label="Chargement de la carte…" /></View>;
  if (menu.isError) return <View style={[styles.page, { paddingTop: insets.top }]}><ErrorState onRetry={() => void menu.refetch()} /></View>;
  return (
    <View style={styles.page}>
      <ScrollView refreshControl={<RefreshControl refreshing={menu.categories.isFetching || menu.products.isFetching} onRefresh={() => void menu.refetch()} tintColor={colors.turquoise} />} contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.heading}><Text style={styles.eyebrow}>À VOTRE TABLE</Text><Text style={styles.title}>La carte</Text><Text style={styles.subtitle}>Des saveurs simples, fraîches et inspirées de notre côte.</Text></View>
        <FlatList horizontal data={[{ id: 'all', name: 'Tout', icon: 'grid-outline' }, ...categories]} keyExtractor={(item) => item.id} renderItem={({ item }) => <CategoryCard category={item} selected={selected === item.id} onPress={() => setSelected(item.id)} />} contentContainerStyle={styles.categories} showsHorizontalScrollIndicator={false} />
        <View style={styles.resultRow}><Text style={styles.resultTitle}>{selected === 'all' ? 'Toute la carte' : categories.find((category) => category.id === selected)?.name}</Text><Text style={styles.resultCount}>{visible.length} choix</Text></View>
        {visible.length ? <View style={styles.grid}>{visible.map((product) => <ProductCard key={product.id} product={product} onPress={() => router.push(`/product/${product.id}`)} onAdd={() => addItem(product)} />)}</View> : <EmptyState title="Aucun produit" description="Aucun produit n’est disponible dans cette catégorie actuellement." />}
      </ScrollView>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.warmIvory }, content: { paddingBottom: 30 },
  heading: { paddingHorizontal: 18, marginBottom: 20 }, eyebrow: { color: colors.terracotta, fontSize: 11, letterSpacing: 1.8, fontWeight: '800' },
  title: { marginTop: 3, fontSize: 34, fontWeight: '800', color: colors.primaryBlue }, subtitle: { marginTop: 6, color: colors.muted, lineHeight: 21, maxWidth: 340 },
  categories: { paddingHorizontal: 18, gap: 10 }, resultRow: { paddingHorizontal: 18, marginTop: 26, marginBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resultTitle: { color: colors.primaryBlue, fontSize: 21, fontWeight: '800' }, resultCount: { color: colors.muted, fontSize: 13 },
  grid: { paddingHorizontal: 18, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});
