import { useLocalSearchParams } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCancelOrder, useOrder } from '@/api/orders';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { statusLabel, statusTone } from '@/components/OrderStatus';
import { ScreenHeader } from '@/components/ScreenHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateViews';
import { useAuthStore } from '@/store/auth-store';
import { colors, radius } from '@/theme/colors';
import { formatPrice } from '@/utils/currency';
import { useOrderRealtime } from '@/hooks/use-order-realtime';
export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); const insets = useSafeAreaInsets(); const user = useAuthStore((state) => state.user); const query = useOrder(id, Boolean(user)); const cancelOrder = useCancelOrder(); useOrderRealtime(user ? id : undefined); const order = query.data;
  if (query.isLoading) return <View style={[styles.page, { paddingTop: insets.top }]}><ScreenHeader title="Commande" /><LoadingState /></View>;
  if (query.isError) return <View style={[styles.page, { paddingTop: insets.top }]}><ScreenHeader title="Commande" /><ErrorState onRetry={() => void query.refetch()} /></View>;
  if (!order) return <View style={[styles.page, { paddingTop: insets.top }]}><ScreenHeader title="Commande" /><EmptyState title="Commande introuvable" description="Ce détail n’est pas disponible." /></View>;
  const orderId = order.id;
  function confirmCancellation() { Alert.alert('Annuler la commande ?', 'Le restaurant sera immédiatement informé. Cette action est définitive.', [{ text: 'Garder ma commande', style: 'cancel' }, { text: 'Annuler la commande', style: 'destructive', onPress: () => cancelOrder.mutate(orderId) }]); }
  return <View style={[styles.page, { paddingTop: insets.top }]}><ScreenHeader title={order.number} /><ScrollView contentContainerStyle={styles.content}><Badge label={statusLabel(order.status)} tone={statusTone(order.status)} /><Text style={styles.date}>{order.date}</Text><View style={styles.card}><Text style={styles.title}>Détail de la commande</Text>{order.items.map((item) => <View key={`${item.productId}-${item.name}`} style={styles.row}><Text style={styles.item}>{item.quantity}× {item.name}</Text><Text style={styles.value}>{formatPrice(item.quantity * item.unitPrice)}</Text></View>)}<View style={styles.divider} /><View style={styles.row}><Text style={styles.totalLabel}>Total</Text><Text style={styles.total}>{formatPrice(order.total)}</Text></View></View><View style={styles.card}><Text style={styles.title}>Informations</Text><Text style={styles.info}>{order.orderType === 'DINE_IN' ? 'Sur place' : 'À emporter'} · Paiement sur place — en espèces</Text></View>{order.status === 'PENDING' || order.status === 'CONFIRMED' ? <><Button label="Annuler ma commande" variant="ghost" loading={cancelOrder.isPending} onPress={confirmCancellation} style={styles.cancelButton} />{cancelOrder.isError ? <Text accessibilityRole="alert" style={styles.cancelError}>{cancelOrder.error.message}</Text> : null}</> : null}</ScrollView></View>;
}
const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: colors.warmIvory }, content: { padding: 18, gap: 12 }, date: { color: colors.muted }, card: { padding: 18, backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, gap: 14 }, title: { color: colors.primaryBlue, fontSize: 18, fontWeight: '800' }, row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 }, item: { flex: 1, color: colors.charcoal }, value: { color: colors.charcoal, fontWeight: '700' }, divider: { height: 1, backgroundColor: colors.border }, totalLabel: { color: colors.primaryBlue, fontWeight: '800' }, total: { color: colors.primaryBlue, fontWeight: '800', fontSize: 18 }, info: { color: colors.muted, lineHeight: 21 }, cancelButton: { marginTop: 4, borderWidth: 1, borderColor: colors.danger }, cancelError: { color: colors.danger, textAlign: 'center', lineHeight: 20 } });
