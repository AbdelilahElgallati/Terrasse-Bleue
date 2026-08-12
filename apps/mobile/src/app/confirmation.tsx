import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/StateViews';
import { useOrderStore } from '@/store/order-store';
import { useAuthStore } from '@/store/auth-store';
import { colors, radius } from '@/theme/colors';
import { formatPrice } from '@/utils/currency';

export default function ConfirmationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const order = useOrderStore((state) => state.currentOrder);
  const user = useAuthStore((state) => state.user);
  if (!order) return <View style={[styles.page, { paddingTop: insets.top }]}><EmptyState title="Aucune commande récente" description="Votre prochaine commande apparaîtra ici." actionLabel="Retour à l’accueil" onAction={() => router.replace('/home')} /></View>;
  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, { paddingTop: insets.top + 34, paddingBottom: insets.bottom + 28 }]}>
      <View style={styles.check}><Ionicons name="checkmark" size={42} color={colors.white} /></View>
      <Text style={styles.eyebrow}>COMMANDE CONFIRMÉE</Text><Text style={styles.title}>Merci{user?.name ? `, ${user.name.split(' ')[0]}` : ''} !</Text><Text style={styles.subtitle}>Notre équipe s’occupe de tout. Vous pouvez suivre la préparation depuis l’application.</Text>
      <View style={styles.numberCard}><Text style={styles.numberLabel}>Votre numéro</Text><Text style={styles.number}>{order.number}</Text><View style={styles.estimate}><Ionicons name="radio-outline" size={20} color={colors.turquoise} /><Text style={styles.estimateText}>Suivez son avancement en direct</Text></View></View>
      <View style={styles.summary}><Text style={styles.summaryTitle}>Récapitulatif</Text>{order.items.map((item) => <View key={`${item.productId}-${item.name}`} style={styles.row}><Text style={styles.item}>{item.quantity}× {item.name}</Text><Text style={styles.price}>{formatPrice(item.unitPrice * item.quantity)}</Text></View>)}<View style={styles.divider} /><View style={styles.row}><Text style={styles.item}>Sous-total</Text><Text style={styles.price}>{formatPrice(order.subtotal)}</Text></View>{order.deliveryFee ? <View style={styles.row}><Text style={styles.item}>Livraison à Essaouira</Text><Text style={styles.price}>{formatPrice(order.deliveryFee)}</Text></View> : null}<View style={styles.divider} /><View style={styles.row}><Text style={styles.totalLabel}>Total</Text><Text style={styles.total}>{formatPrice(order.total)}</Text></View></View>
      {order.deliveryAddress ? <View style={styles.restaurant}><Ionicons name="bicycle-outline" size={23} color={colors.turquoise} /><View style={styles.addressCopy}><Text style={styles.restaurantName}>Livraison à {order.deliveryAddress.recipientName}</Text><Text style={styles.restaurantAddress}>{order.deliveryAddress.addressLine}{order.deliveryAddress.neighborhood ? ` · ${order.deliveryAddress.neighborhood}` : ''}{` · ${order.deliveryAddress.city}`}</Text><Text style={styles.restaurantAddress}>{order.deliveryAddress.phone}</Text></View></View> : <View style={styles.restaurant}><Ionicons name="location-outline" size={23} color={colors.turquoise} /><View><Text style={styles.restaurantName}>Terrasse Bleue</Text><Text style={styles.restaurantAddress}>Essaouira · Médina · Maroc</Text></View></View>}
      {order.paymentMethod === 'ONLINE' ? <View style={styles.paymentNotice}><Ionicons name="shield-checkmark-outline" size={22} color={colors.primaryBlue} /><Text style={styles.paymentNoticeText}>Paiement en ligne validé.</Text></View> : null}
      <Button label="Suivre ma commande" onPress={() => router.replace('/tracking')} />
      <Button label="Retour à l’accueil" variant="ghost" onPress={() => router.replace('/home')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.warmIvory }, content: { paddingHorizontal: 22, alignItems: 'stretch' }, check: { width: 82, height: 82, borderRadius: 41, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.success },
  eyebrow: { marginTop: 22, textAlign: 'center', color: colors.terracotta, fontSize: 11, letterSpacing: 1.8, fontWeight: '800' }, title: { marginTop: 5, textAlign: 'center', color: colors.primaryBlue, fontSize: 31, fontWeight: '800' }, subtitle: { marginTop: 8, marginBottom: 22, textAlign: 'center', color: colors.muted, lineHeight: 22 },
  numberCard: { padding: 22, alignItems: 'center', borderRadius: radius.lg, backgroundColor: colors.primaryBlue }, numberLabel: { color: colors.paleTurquoise, fontSize: 13 }, number: { marginTop: 4, color: colors.white, fontSize: 34, fontWeight: '800', letterSpacing: 1 }, estimate: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 7 }, estimateText: { color: colors.white, fontWeight: '600' },
  summary: { marginTop: 14, padding: 18, borderRadius: radius.lg, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, gap: 12 }, summaryTitle: { color: colors.primaryBlue, fontSize: 17, fontWeight: '800' }, row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 }, item: { flex: 1, color: colors.charcoal }, price: { color: colors.charcoal, fontWeight: '700' }, divider: { height: 1, backgroundColor: colors.border }, totalLabel: { color: colors.primaryBlue, fontWeight: '800' }, total: { color: colors.primaryBlue, fontWeight: '800', fontSize: 18 },
  demoBadge: { alignSelf: 'center', marginTop: 16, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999, backgroundColor: '#FFF0D0' }, demoBadgeText: { color: '#866116', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  restaurant: { marginVertical: 18, padding: 14, borderRadius: radius.md, backgroundColor: colors.paleTurquoise, flexDirection: 'row', alignItems: 'center', gap: 11 }, addressCopy: { flex: 1 }, restaurantName: { color: colors.primaryBlue, fontWeight: '800' }, restaurantAddress: { marginTop: 2, color: colors.muted, fontSize: 12, lineHeight: 17 },
  paymentNotice: { marginBottom: 18, padding: 13, flexDirection: 'row', gap: 9, borderRadius: radius.md, backgroundColor: '#FFF4DB' }, paymentNoticeText: { flex: 1, color: colors.primaryBlue, fontSize: 12, lineHeight: 18 },
});
