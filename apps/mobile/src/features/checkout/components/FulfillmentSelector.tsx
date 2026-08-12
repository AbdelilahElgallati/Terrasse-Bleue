import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/theme/colors';
import type { CheckoutFulfillment } from '../types';

const OPTIONS: { value: CheckoutFulfillment; icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string }[] = [
  { value: 'DINE_IN', icon: 'restaurant-outline', title: 'Sur place', subtitle: 'Profitez de la terrasse et du service.' },
  { value: 'TAKEAWAY', icon: 'bag-handle-outline', title: 'À emporter', subtitle: 'Retirez votre commande au restaurant.' },
  { value: 'DELIVERY', icon: 'bicycle-outline', title: 'Livraison', subtitle: 'Partout à Essaouira · frais fixes 25 MAD.' },
];

export function FulfillmentSelector({ value, onChange }: { value: CheckoutFulfillment; onChange: (value: CheckoutFulfillment) => void }) {
  return <View style={styles.group}>{OPTIONS.map((option) => {
    const selected = value === option.value;
    return <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={() => onChange(option.value)} style={({ pressed }) => [styles.choice, selected && styles.selected, pressed && styles.pressed]}>
      <Ionicons name={option.icon} size={24} color={selected ? colors.turquoise : colors.muted} />
      <View style={styles.copy}><Text style={styles.title}>{option.title}</Text><Text style={styles.subtitle}>{option.subtitle}</Text></View>
      <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={22} color={selected ? colors.terracotta : colors.border} />
    </Pressable>;
  })}</View>;
}

const styles = StyleSheet.create({
  group: { gap: 9 },
  choice: { minHeight: 74, padding: 14, borderRadius: radius.md, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 12 },
  selected: { borderColor: colors.turquoise, backgroundColor: colors.paleTurquoise },
  pressed: { opacity: 0.82 },
  copy: { flex: 1 },
  title: { color: colors.primaryBlue, fontWeight: '800' },
  subtitle: { marginTop: 3, color: colors.muted, fontSize: 12, lineHeight: 17 },
});
