import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, ImageBackground, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge } from '@/components/Badge';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/Button';
import { CategoryCard } from '@/components/CategoryCard';
import { ProductCard } from '@/components/ProductCard';
import { fallbackImage } from '@/data/menu';
import { useMenu } from '@/api/menu';
import { ErrorState, LoadingState } from '@/components/StateViews';
import { useCartStore } from '@/store/cart-store';
import { useOrderStore } from '@/store/order-store';
import { useAuthStore } from '@/store/auth-store';
import { colors, radius } from '@/theme/colors';
import { useRestaurantSettings } from '@/api/restaurant';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addItem = useCartStore((state) => state.addItem);
  const currentOrder = useOrderStore((state) => state.currentOrder);
  const user = useAuthStore((state) => state.user);
  const menu = useMenu();
  const restaurant = useRestaurantSettings();
  const service = restaurant.data;
  const orderingAvailable = service?.isOpen !== false && service?.acceptsOrders !== false;
  const categories = menu.categories.data ?? [];
  const featuredProducts = (menu.products.data ?? []).filter((product) => product.featured);
  const activeOrderText = currentOrder ? ({
    PENDING: 'Commande reçue · en attente de confirmation',
    CONFIRMED: `Confirmée · environ ${service?.estimatedPrepMinutes ?? 25} min`,
    PREPARING: 'En préparation par notre équipe',
    READY: 'Prête · vous pouvez la récupérer',
    COMPLETED: 'Terminée · merci !',
    CANCELLED: 'Commande annulée',
  } as const)[currentOrder.status] : '';
  if (menu.isLoading) return <View style={[styles.page, { paddingTop: insets.top }]}><LoadingState label="Préparation de votre accueil…" /></View>;
  if (menu.isError) return <View style={[styles.page, { paddingTop: insets.top }]}><ErrorState onRetry={() => void menu.refetch()} /></View>;
  return (
    <View style={styles.page}>
      <ScrollView refreshControl={<RefreshControl refreshing={menu.categories.isFetching || menu.products.isFetching || restaurant.isFetching} onRefresh={() => void Promise.all([menu.refetch(), restaurant.refetch()])} tintColor={colors.turquoise} />} contentContainerStyle={[styles.content, { paddingTop: insets.top + 10 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View><Text style={styles.greeting}>{user ? `Bonjour, ${user.name.split(' ')[0]}` : 'Bonjour !'}</Text><Text style={styles.location}>{user ? 'Prêt pour une pause gourmande ?' : 'Bienvenue à Terrasse Bleue'}</Text></View>
          <Pressable onPress={() => router.push('/profile')} style={styles.avatar}>{user ? <Text style={styles.avatarText}>{user.name.trim().charAt(0).toUpperCase()}</Text> : <Ionicons name="person-outline" size={22} color={colors.white} />}</Pressable>
        </View>

        <ImageBackground source={featuredProducts[0]?.image ?? fallbackImage} style={styles.hero} imageStyle={styles.heroImage}>
          <View style={styles.overlay} />
          <View style={styles.heroContent}>
            <Badge label={!service?.isOpen ? "FERMÉ ACTUELLEMENT" : service.acceptsOrders ? `OUVERT · ENV. ${service.estimatedPrepMinutes} MIN` : "COMMANDES EN PAUSE"} tone={orderingAvailable ? "green" : "orange"} />
            <Text style={styles.heroTitle}>Le goût d’Essaouira, à votre table.</Text>
            <Text style={styles.heroText}>{orderingAvailable ? `Cuisine fraîche et commande préparée en environ ${service?.estimatedPrepMinutes ?? 25} minutes.` : "Vous pouvez consulter notre menu. Les nouvelles commandes reprendront dès que possible."}</Text>
            <Button label={orderingAvailable ? "Découvrir le menu" : "Consulter le menu"} onPress={() => router.push('/menu')} style={styles.heroButton} />
          </View>
        </ImageBackground>

        {currentOrder ? (
          <Pressable onPress={() => router.push('/tracking')} style={styles.activeOrder}>
            <View style={styles.orderIcon}><Ionicons name="time-outline" size={25} color={colors.white} /></View>
            <View style={styles.activeOrderCopy}><Text style={styles.activeOrderTitle}>Commande {currentOrder.number}</Text><Text style={styles.activeOrderText}>{activeOrderText}</Text></View>
            <Ionicons name="chevron-forward" size={22} color={colors.primaryBlue} />
          </Pressable>
        ) : null}

        <View style={styles.sectionHeader}><View><Text style={styles.sectionEyebrow}>POUR TOUS LES MOMENTS</Text><Text style={styles.sectionTitle}>Nos univers</Text></View><Pressable onPress={() => router.push('/menu')}><Text style={styles.seeAll}>Tout voir</Text></Pressable></View>
        <FlatList horizontal data={categories.slice(0, 5)} keyExtractor={(item) => item.id} renderItem={({ item }) => <CategoryCard category={item} onPress={() => router.push({ pathname: '/menu', params: { category: item.id } })} />} contentContainerStyle={styles.horizontalList} showsHorizontalScrollIndicator={false} />

        <View style={styles.sectionHeader}><View><Text style={styles.sectionEyebrow}>LES INCONTOURNABLES</Text><Text style={styles.sectionTitle}>Nos favoris</Text></View></View>
        <View style={styles.grid}>{featuredProducts.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} onPress={() => router.push(`/product/${product.id}`)} onAdd={() => addItem(product)} />)}</View>
        <View style={styles.story}><Ionicons name="location-outline" size={28} color={colors.terracotta} /><View style={styles.storyCopy}><Text style={styles.storyTitle}>{service?.restaurantName ?? "Votre adresse gourmande à Essaouira"}</Text><Text style={styles.storyText}>{service?.address ?? "Essaouira, Maroc"}{service?.contactPhone ? ` · ${service.contactPhone}` : ""}{service?.contactEmail ? `\n${service.contactEmail}` : ""}</Text></View></View>
      </ScrollView>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.warmIvory },
  content: { paddingBottom: 30 },
  header: { paddingHorizontal: 18, marginBottom: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greeting: { fontSize: 24, fontWeight: '800', color: colors.primaryBlue },
  location: { marginTop: 3, color: colors.muted, fontSize: 14 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.turquoise, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontSize: 18, fontWeight: '800' },
  hero: { marginHorizontal: 18, height: 320, overflow: 'hidden', borderRadius: radius.lg, justifyContent: 'flex-end' },
  heroImage: { borderRadius: radius.lg },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(18,59,74,0.52)' },
  heroContent: { padding: 22, gap: 10 },
  heroTitle: { color: colors.white, fontSize: 29, lineHeight: 34, fontWeight: '800', maxWidth: 310 },
  heroText: { color: colors.white, fontSize: 14, lineHeight: 20, maxWidth: 300 },
  heroButton: { marginTop: 5, alignSelf: 'flex-start', backgroundColor: colors.terracotta },
  activeOrder: { margin: 18, marginBottom: 0, padding: 14, borderRadius: radius.md, backgroundColor: colors.paleTurquoise, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.turquoise },
  orderIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.turquoise, alignItems: 'center', justifyContent: 'center' },
  activeOrderCopy: { flex: 1 }, activeOrderTitle: { fontWeight: '800', color: colors.primaryBlue }, activeOrderText: { color: colors.muted, marginTop: 3, fontSize: 13 },
  sectionHeader: { marginTop: 28, marginBottom: 14, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  sectionEyebrow: { color: colors.terracotta, fontSize: 10, letterSpacing: 1.5, fontWeight: '800' },
  sectionTitle: { marginTop: 4, color: colors.primaryBlue, fontSize: 24, fontWeight: '800' },
  seeAll: { color: colors.turquoise, fontWeight: '700' },
  horizontalList: { paddingHorizontal: 18, gap: 10 },
  grid: { paddingHorizontal: 18, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  story: { margin: 18, marginTop: 28, padding: 18, borderRadius: radius.lg, backgroundColor: colors.primaryBlue, flexDirection: 'row', gap: 14 },
  storyCopy: { flex: 1 }, storyTitle: { color: colors.white, fontWeight: '800', fontSize: 17 }, storyText: { color: colors.paleTurquoise, lineHeight: 20, marginTop: 4, fontSize: 13 },
});
