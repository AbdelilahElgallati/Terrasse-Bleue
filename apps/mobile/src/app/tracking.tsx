import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { OrderStatus } from '@/components/OrderStatus';
import { EmptyState } from '@/components/StateViews';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useOrderStore } from '@/store/order-store';
import { useCancelOrder, useOrder } from '@/api/orders';
import { useAuthStore } from '@/store/auth-store';
import { colors, radius } from '@/theme/colors';
import { useOrderRealtime } from '@/hooks/use-order-realtime';

export default function TrackingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const storedOrder = useOrderStore((state) => state.currentOrder);
  const user = useAuthStore((state) => state.user);
  const query = useOrder(storedOrder?.id, Boolean(user && storedOrder));
  const cancelOrder = useCancelOrder();
  const connectionState = useOrderRealtime(user ? storedOrder?.id : undefined);
  const order = query.data ?? storedOrder;
  function confirmCancellation() {
    if (!order) return;
    Alert.alert('Annuler la commande ?', 'Le restaurant sera immédiatement informé. Cette action est définitive.', [
      { text: 'Garder ma commande', style: 'cancel' },
      { text: 'Annuler la commande', style: 'destructive', onPress: () => cancelOrder.mutate(order.id) },
    ]);
  }
  if (!order) return <View style={[styles.page, { paddingTop: insets.top }]}><ScreenHeader title="Suivi" /><EmptyState title="Aucune commande en cours" description="Votre prochaine commande pourra être suivie ici, étape par étape." actionLabel="Découvrir le menu" onAction={() => router.replace('/menu')} /></View>;
  return (
    <View style={[styles.page, { paddingTop: insets.top }]}><ScreenHeader title="Suivi de commande" /><ScrollView refreshControl={<RefreshControl refreshing={query.isFetching} onRefresh={() => void query.refetch()} tintColor={colors.turquoise} />} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}><View style={styles.heroCopy}><Text style={styles.eyebrow}>COMMANDE EN COURS</Text><Text style={styles.number}>{order.number}</Text></View><View style={styles.timer}><Text style={styles.timerValue}>EN</Text><Text style={styles.timerLabel}>direct</Text></View></View>
      <Text style={styles.title}>Ça mijote en cuisine</Text><Text style={styles.subtitle}>Le statut est synchronisé avec le restaurant. Tirez pour actualiser ou patientez quelques instants.</Text>
      {connectionState !== 'connected' ? <Text style={styles.connection}>Mise à jour en direct indisponible · actualisation REST active</Text> : null}
      <View style={styles.statusCard}><OrderStatus status={order.status} /></View>
      <View style={styles.info}><Ionicons name="notifications-outline" size={24} color={colors.turquoise} /><Text style={styles.infoText}>Gardez l’application à portée de main. Nous vous indiquerons quand votre commande sera prête.</Text></View>
      <Button label="Actualiser le statut" variant="secondary" loading={query.isFetching} onPress={() => void query.refetch()} />
      {order.status === 'PENDING' || order.status === 'CONFIRMED' ? <><Button label="Annuler ma commande" variant="ghost" loading={cancelOrder.isPending} onPress={confirmCancellation} style={styles.cancelButton} />{cancelOrder.isError ? <Text accessibilityRole="alert" style={styles.cancelError}>{cancelOrder.error.message}</Text> : null}</> : null}
      <Button label="Retour à l’accueil" variant="ghost" onPress={() => router.replace('/home')} />
    </ScrollView></View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.warmIvory }, content: { padding: 18, paddingBottom: 32 }, hero: { padding: 20, borderRadius: radius.lg, backgroundColor: colors.primaryBlue, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }, heroCopy: { flex: 1 }, eyebrow: { color: colors.paleTurquoise, fontSize: 10, letterSpacing: 1.4, fontWeight: '800' }, number: { marginTop: 5, color: colors.white, fontSize: 24, fontWeight: '800' }, timer: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.terracotta, alignItems: 'center', justifyContent: 'center' }, timerValue: { color: colors.white, fontSize: 17, fontWeight: '800' }, timerLabel: { color: colors.white, fontSize: 10 },
  title: { marginTop: 24, color: colors.primaryBlue, fontSize: 27, fontWeight: '800' }, subtitle: { marginTop: 7, color: colors.muted, lineHeight: 21 }, statusCard: { marginTop: 22, padding: 20, paddingBottom: 3, borderRadius: radius.lg, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border }, info: { marginVertical: 18, padding: 15, borderRadius: radius.md, backgroundColor: colors.paleTurquoise, flexDirection: 'row', gap: 12 }, infoText: { flex: 1, color: colors.primaryBlue, lineHeight: 20, fontSize: 13 },
  connection: { marginTop: 10, color: colors.muted, fontSize: 12 },
  cancelButton: { marginTop: 8, borderWidth: 1, borderColor: colors.danger },
  cancelError: { marginTop: 8, color: colors.danger, textAlign: 'center', lineHeight: 20 },
});
