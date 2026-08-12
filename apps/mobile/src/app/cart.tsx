import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { CartItem } from '@/components/CartItem';
import { EmptyState } from '@/components/StateViews';
import { ScreenHeader } from '@/components/ScreenHeader';
import { selectCartTotal, useCartStore } from '@/store/cart-store';
import { colors, radius } from '@/theme/colors';
import { formatPrice } from '@/utils/currency';

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const items = useCartStore((state) => state.items);
  const total = useCartStore(selectCartTotal);
  const increase = useCartStore((state) => state.increase);
  const decrease = useCartStore((state) => state.decrease);
  const remove = useCartStore((state) => state.remove);
  return (
    <View style={[styles.page, { paddingTop: insets.top }]}>
      <ScreenHeader title="Votre panier" />
      {items.length === 0 ? <EmptyState title="Votre panier est vide" description="Une envie de tajine, de café ou d’une douceur ? Toute la carte vous attend." actionLabel="Voir le menu" onAction={() => router.replace('/menu')} /> : (
        <>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.intro}>{items.length} sélection{items.length > 1 ? 's' : ''} préparée{items.length > 1 ? 's' : ''} avec soin</Text>
            <View style={styles.list}>{items.map((item) => <CartItem key={item.id} item={item} onIncrease={() => increase(item.id)} onDecrease={() => decrease(item.id)} onRemove={() => remove(item.id)} />)}</View>
            <Button label="Continuer mes achats" variant="ghost" onPress={() => router.push('/menu')} />
            <View style={styles.summary}><View style={styles.row}><Text style={styles.label}>Sous-total</Text><Text style={styles.value}>{formatPrice(total)}</Text></View><View style={styles.row}><Text style={styles.label}>Frais de service</Text><Text style={styles.free}>Offerts</Text></View><View style={styles.divider} /><View style={styles.row}><Text style={styles.totalLabel}>Total</Text><Text style={styles.total}>{formatPrice(total)}</Text></View></View>
          </ScrollView>
          <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 12) }]}><Button label={`Passer à la commande · ${formatPrice(total)}`} onPress={() => router.push('/checkout')} /></View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.warmIvory }, content: { padding: 18, paddingBottom: 28 }, intro: { color: colors.muted, marginBottom: 14 }, list: { gap: 12 },
  summary: { marginTop: 12, padding: 18, backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, gap: 13 }, row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, label: { color: colors.muted }, value: { color: colors.charcoal, fontWeight: '700' }, free: { color: colors.success, fontWeight: '700' }, divider: { height: 1, backgroundColor: colors.border }, totalLabel: { color: colors.primaryBlue, fontWeight: '800', fontSize: 17 }, total: { color: colors.primaryBlue, fontWeight: '800', fontSize: 20 },
  bottom: { padding: 14, paddingHorizontal: 18, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border },
});
