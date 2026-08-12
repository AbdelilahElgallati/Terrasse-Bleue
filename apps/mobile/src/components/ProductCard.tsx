import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Product } from '@/types/menu';
import { colors, radius } from '@/theme/colors';
import { formatPrice } from '@/utils/currency';
import { SafeImage } from './SafeImage';

export function ProductCard({ product, onPress, onAdd }: { product: Product; onPress: () => void; onAdd: () => void }) {
  const requiresConfiguration = Boolean(product.options?.length);
  const [added, setAdded] = useState(false);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
  }, []);
  function handleAdd() {
    if (requiresConfiguration) {
      onPress();
      return;
    }
    onAdd();
    setAdded(true);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setAdded(false), 1400);
  }
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <SafeImage source={product.image} style={styles.image} resizeMode="cover" accessibilityLabel={`Photo de ${product.name}`} />
      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.name}>{product.name}</Text>
        <Text numberOfLines={2} style={styles.description}>{product.description}</Text>
        <View style={styles.footer}>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
          {added ? <Text accessibilityLiveRegion="polite" style={styles.added}>Ajouté</Text> : null}
          <Pressable accessibilityRole="button" accessibilityLabel={requiresConfiguration ? `Choisir les options de ${product.name}` : `Ajouter ${product.name}`} disabled={!product.available} onPress={(event) => { event.stopPropagation(); handleAdd(); }} style={[styles.add, !product.available && styles.disabled]}>
            <Ionicons name={!product.available ? 'close' : requiresConfiguration ? 'options-outline' : added ? 'checkmark' : 'add'} size={22} color={colors.white} />
          </Pressable>
        </View>
        {!product.available ? <Text style={styles.unavailable}>Indisponible aujourd’hui</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 158, overflow: 'hidden', borderRadius: radius.lg, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  image: { width: '100%', height: 132, backgroundColor: colors.sand },
  content: { padding: 13, minHeight: 150 },
  name: { minHeight: 40, fontSize: 16, lineHeight: 20, fontWeight: '800', color: colors.primaryBlue },
  description: { marginTop: 5, minHeight: 38, fontSize: 13, lineHeight: 18, color: colors.muted },
  footer: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { color: colors.charcoal, fontWeight: '800', fontSize: 15 },
  add: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.terracotta, alignItems: 'center', justifyContent: 'center' },
  added: { marginLeft: 'auto', color: colors.success, fontSize: 11, fontWeight: '800' },
  disabled: { backgroundColor: colors.muted },
  unavailable: { marginTop: 6, color: colors.danger, fontSize: 11, fontWeight: '700' },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
});
