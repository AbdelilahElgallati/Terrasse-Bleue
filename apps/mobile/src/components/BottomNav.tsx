import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useCartStore, selectCartCount } from '@/store/cart-store';
import { colors } from '@/theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const items = [
  { label: 'Accueil', icon: 'home-outline', activeIcon: 'home', href: '/home' },
  { label: 'Menu', icon: 'restaurant-outline', activeIcon: 'restaurant', href: '/menu' },
  { label: 'Panier', icon: 'basket-outline', activeIcon: 'basket', href: '/cart' },
  { label: 'Profil', icon: 'person-outline', activeIcon: 'person', href: '/profile' },
] as const;

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const count = useCartStore(selectCartCount);
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Pressable key={item.href} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => { if (!active) router.navigate(item.href); }} style={({ pressed }) => [styles.item, pressed && !active && styles.pressed]}>
            <View>
              <Ionicons name={(active ? item.activeIcon : item.icon) as keyof typeof Ionicons.glyphMap} size={23} color={active ? colors.terracotta : colors.muted} />
              {item.href === '/cart' && count > 0 ? <View style={styles.count}><Text style={styles.countText}>{count}</Text></View> : null}
            </View>
            <Text style={[styles.label, active && styles.activeLabel]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { minHeight: 72, paddingTop: 8, flexDirection: 'row', backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 }, pressed: { opacity: 0.62, transform: [{ scale: 0.96 }] },
  label: { color: colors.muted, fontSize: 11, fontWeight: '600' },
  activeLabel: { color: colors.primaryBlue, fontWeight: '800' },
  count: { position: 'absolute', right: -10, top: -7, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: colors.terracotta, alignItems: 'center', justifyContent: 'center' },
  countText: { color: colors.white, fontSize: 10, fontWeight: '800' },
});
