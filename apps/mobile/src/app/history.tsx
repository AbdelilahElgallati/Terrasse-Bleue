import { useRouter } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOrders } from '@/api/orders';
import { OrderCard } from '@/components/OrderCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateViews';
import { useAuthStore } from '@/store/auth-store';
import { colors } from '@/theme/colors';

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const query = useOrders(Boolean(user));
  if (!user) return <View style={[styles.page, { paddingTop: insets.top }]}><ScreenHeader title="Mes commandes" /><EmptyState title="Connexion requise" description="Connectez-vous pour retrouver vos commandes." actionLabel="Se connecter" onAction={() => router.push('/auth')} /></View>;
  if (query.isLoading) return <View style={[styles.page, { paddingTop: insets.top }]}><ScreenHeader title="Mes commandes" /><LoadingState /></View>;
  if (query.isError) return <View style={[styles.page, { paddingTop: insets.top }]}><ScreenHeader title="Mes commandes" /><ErrorState onRetry={() => void query.refetch()} /></View>;
  const orders = query.data ?? [];
  return <View style={[styles.page, { paddingTop: insets.top }]}><ScreenHeader title="Mes commandes" /><ScrollView refreshControl={<RefreshControl refreshing={query.isFetching} onRefresh={() => void query.refetch()} tintColor={colors.turquoise} />} contentContainerStyle={orders.length ? styles.content : styles.emptyContent}>{orders.length ? <><Text style={styles.intro}>Retrouvez vos dernières pauses gourmandes.</Text><View style={styles.list}>{orders.map((order) => <OrderCard key={order.id} order={order} onPress={() => router.push({ pathname: '/order/[id]', params: { id: order.id } })} />)}</View></> : <EmptyState title="Aucune commande" description="Vos commandes passées apparaîtront ici." actionLabel="Voir le menu" onAction={() => router.push('/menu')} />}</ScrollView></View>;
}

const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: colors.warmIvory }, content: { padding: 18, paddingBottom: 30 }, emptyContent: { flexGrow: 1 }, intro: { color: colors.muted, marginBottom: 16 }, list: { gap: 12 } });
