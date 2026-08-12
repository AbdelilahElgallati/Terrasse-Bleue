import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { CartItem as CartItemType } from '@/store/cart-store';
import { QuantitySelector } from './QuantitySelector';
import { colors, radius } from '@/theme/colors';
import { formatPrice } from '@/utils/currency';
import { SafeImage } from './SafeImage';

export function CartItem({ item, onIncrease, onDecrease, onRemove }: { item: CartItemType; onIncrease: () => void; onDecrease: () => void; onRemove: () => void }) {
  const optionLabels = (item.product.options ?? []).flatMap((option) => {
    const value = option.values.find((candidate) => candidate.id === item.selectedOptions[option.id]);
    return value ? [value.label] : [];
  });
  return (
    <View style={styles.card}>
      <SafeImage source={item.product.image} style={styles.image} accessibilityLabel={`Photo de ${item.product.name}`} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text numberOfLines={2} style={styles.name}>{item.product.name}</Text>
          <Pressable accessibilityLabel={`Retirer ${item.product.name}`} onPress={onRemove} style={styles.remove}>
            <Ionicons name="trash-outline" size={19} color={colors.danger} />
          </Pressable>
        </View>
        {optionLabels.length ? <Text numberOfLines={1} style={styles.options}>{optionLabels.join(' · ')}</Text> : null}
        <View style={styles.footer}>
          <QuantitySelector compact value={item.quantity} onDecrease={onDecrease} onIncrease={onIncrease} />
          <Text style={styles.price}>{formatPrice(item.unitPrice * item.quantity)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: radius.lg, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, gap: 12 },
  image: { width: 88, height: 108, alignSelf: 'flex-start', borderRadius: radius.md, backgroundColor: colors.sand },
  content: { flex: 1, minHeight: 108, justifyContent: 'space-between' },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  name: { flex: 1, fontSize: 16, fontWeight: '800', color: colors.primaryBlue },
  remove: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  options: { color: colors.muted, fontSize: 12 },
  footer: { marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  price: { fontSize: 15, fontWeight: '800', color: colors.charcoal },
});
