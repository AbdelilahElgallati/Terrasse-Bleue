import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateViews';
import { QuantitySelector } from '@/components/QuantitySelector';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useProduct } from '@/api/menu';
import { useCartStore } from '@/store/cart-store';
import { colors, radius } from '@/theme/colors';
import { SafeImage } from '@/components/SafeImage';
import { formatPrice, formatMADSupplement } from '@/utils/currency';

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useProduct(id);
  const product = query.data;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const heroHeight = Math.min(Math.max(width * 0.68, 250), 340);
  const addItem = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  if (query.isLoading) return <View style={[styles.page, { paddingTop: insets.top }]}><ScreenHeader title="Produit" /><LoadingState /></View>;
  if (query.isError) return <View style={[styles.page, { paddingTop: insets.top }]}><ScreenHeader title="Produit" /><ErrorState onRetry={() => void query.refetch()} /></View>;
  if (!product) return <View style={[styles.page, { paddingTop: insets.top }]}><ScreenHeader title="Produit" /><EmptyState title="Produit introuvable" description="Ce produit n’est plus disponible." actionLabel="Retour au menu" onAction={() => router.replace('/menu')} /></View>;
  const effectiveSelectedOptions = Object.fromEntries((product.options ?? []).map((option) => [option.id, selectedOptions[option.id] ?? option.values[0]?.id ?? '']));
  const optionDelta = (product.options ?? []).reduce((sum, option) => sum + (option.values.find((value) => value.id === effectiveSelectedOptions[option.id])?.priceDelta ?? 0), 0);
  const total = (product.price + optionDelta) * quantity;
  function addToCart() {
    addItem(product!, quantity, effectiveSelectedOptions);
    router.push('/cart');
  }
  return (
    <View style={[styles.page, { paddingTop: insets.top }]}>
      <ScreenHeader title="Détail" />
      <ScrollView refreshControl={<RefreshControl refreshing={query.isFetching} onRefresh={() => void query.refetch()} tintColor={colors.turquoise} />} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.imageWrap, { height: heroHeight }]}><SafeImage source={product.image} style={styles.image} resizeMode="cover" accessibilityLabel={`Photo de ${product.name}`} /><View style={styles.imageShade} /><View style={styles.imageBadge}><Ionicons name="restaurant-outline" size={16} color={colors.white} /><Text style={styles.imageBadgeText}>Préparé à la commande</Text></View></View>
        <View style={styles.bodyShell}><View style={styles.body}>
          <Badge label={product.available ? 'Disponible aujourd’hui' : 'Indisponible'} tone={product.available ? 'green' : 'orange'} />
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.description}>{product.description}</Text>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
          <View style={styles.highlights}><View style={styles.highlight}><Ionicons name="restaurant-outline" size={19} color={colors.turquoise} /><View><Text style={styles.highlightTitle}>Préparation</Text><Text style={styles.highlightValue}>À la commande</Text></View></View><View style={styles.highlight}><Ionicons name="sparkles-outline" size={19} color={colors.terracotta} /><View><Text style={styles.highlightTitle}>Cuisine</Text><Text style={styles.highlightValue}>Fait maison</Text></View></View></View>
          {(product.options ?? []).map((option) => (
            <View key={option.id} style={styles.optionGroup}>
              <Text style={styles.optionTitle}>{option.name}</Text>
              <View style={styles.optionList}>{option.values.map((value) => {
                const active = effectiveSelectedOptions[option.id] === value.id;
                return <Pressable key={value.id} accessibilityRole="radio" accessibilityState={{ checked: active }} accessibilityLabel={`${option.name}, ${value.label}${value.priceDelta ? `, supplément ${formatMADSupplement(value.priceDelta)}` : ''}`} onPress={() => setSelectedOptions((current) => ({ ...current, [option.id]: value.id }))} style={[styles.option, active && styles.optionActive]}><Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{value.label}{value.priceDelta ? `  ${formatMADSupplement(value.priceDelta)}` : ''}</Text></Pressable>;
              })}</View>
            </View>
          ))}
          <View style={styles.quantityRow}><View><Text style={styles.optionTitle}>Quantité</Text><Text style={styles.helper}>Combien souhaitez-vous ?</Text></View><QuantitySelector value={quantity} onDecrease={() => setQuantity((value) => Math.max(1, value - 1))} onIncrease={() => setQuantity((value) => value + 1)} /></View>
        </View></View>
      </ScrollView>
      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 12) }]}><View><Text style={styles.totalLabel}>{quantity} article{quantity > 1 ? 's' : ''}</Text><Text style={styles.total}>{formatPrice(total)}</Text></View><Button label="Ajouter au panier" disabled={!product.available} onPress={addToCart} style={styles.addButton} /></View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.warmIvory }, content: { paddingBottom: 110 }, imageWrap: { position: 'relative', width: '100%', overflow: 'hidden', backgroundColor: colors.sand }, image: { width: '100%', height: '100%' }, imageShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(18,59,74,0.08)' }, imageBadge: { position: 'absolute', left: 16, bottom: 14, paddingHorizontal: 11, minHeight: 34, borderRadius: 17, backgroundColor: 'rgba(18,59,74,0.88)', flexDirection: 'row', alignItems: 'center', gap: 7 }, imageBadgeText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  bodyShell: { width: '100%', maxWidth: 720, alignSelf: 'center' }, body: { padding: 20 }, name: { marginTop: 14, color: colors.primaryBlue, fontSize: 30, lineHeight: 35, fontWeight: '800' }, description: { marginTop: 9, color: colors.muted, fontSize: 16, lineHeight: 24 }, price: { marginTop: 12, color: colors.terracotta, fontSize: 22, fontWeight: '800' },
  highlights: { marginTop: 20, flexDirection: 'row', gap: 10 }, highlight: { flex: 1, minHeight: 62, padding: 11, borderRadius: radius.md, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 9 }, highlightTitle: { color: colors.muted, fontSize: 10 }, highlightValue: { marginTop: 2, color: colors.primaryBlue, fontSize: 12, fontWeight: '800' },
  optionGroup: { marginTop: 28 }, optionTitle: { color: colors.primaryBlue, fontSize: 17, fontWeight: '800' }, optionList: { marginTop: 10, gap: 8 },
  option: { minHeight: 48, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.white, justifyContent: 'center' }, optionActive: { borderColor: colors.turquoise, backgroundColor: colors.paleTurquoise }, optionLabel: { color: colors.charcoal, fontWeight: '600' }, optionLabelActive: { color: colors.primaryBlue, fontWeight: '800' },
  quantityRow: { marginTop: 28, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, helper: { color: colors.muted, fontSize: 12, marginTop: 3 },
  bottom: { padding: 14, paddingHorizontal: 18, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 18 }, totalLabel: { color: colors.muted, fontSize: 12 }, total: { color: colors.primaryBlue, fontWeight: '800', fontSize: 19 }, addButton: { flex: 1 },
});
