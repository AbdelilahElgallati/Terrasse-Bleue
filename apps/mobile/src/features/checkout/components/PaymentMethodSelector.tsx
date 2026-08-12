import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/theme/colors';
import type { CheckoutFulfillment, CheckoutPayment } from '../types';

export function PaymentMethodSelector({ value, fulfillment, onChange }: { value: CheckoutPayment; fulfillment: CheckoutFulfillment; onChange: (value: CheckoutPayment) => void }) {
  const cashSubtitle = fulfillment === 'DELIVERY' ? 'Réglez au livreur à la réception.' : 'Réglez directement au restaurant.';
  return <View style={styles.group}>
    <Choice selected={value === 'CASH'} icon="cash-outline" title="Paiement en espèces" subtitle={cashSubtitle} onPress={() => onChange('CASH')} />
    <Choice selected={value === 'ONLINE'} icon="card-outline" title="Paiement en ligne" subtitle="Réglez votre commande directement depuis l’application." onPress={() => onChange('ONLINE')} />
  </View>;
}

function Choice({ selected, icon, title, subtitle, onPress }: { selected: boolean; icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string; onPress: () => void }) {
  return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={onPress} style={({ pressed }) => [styles.choice, selected && styles.selected, pressed && styles.pressed]}><Ionicons name={icon} size={24} color={selected ? colors.turquoise : colors.muted} /><View style={styles.copy}><Text style={styles.title}>{title}</Text><Text style={styles.subtitle}>{subtitle}</Text></View><Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={22} color={selected ? colors.terracotta : colors.border} /></Pressable>;
}

const styles = StyleSheet.create({ group: { gap: 9 }, choice: { minHeight: 74, padding: 14, borderRadius: radius.md, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 12 }, selected: { borderColor: colors.turquoise, backgroundColor: colors.paleTurquoise }, pressed: { opacity: 0.82 }, copy: { flex: 1 }, title: { color: colors.primaryBlue, fontWeight: '800' }, subtitle: { marginTop: 3, color: colors.muted, fontSize: 12, lineHeight: 17 }, demoNotice: { padding: 13, flexDirection: 'row', gap: 9, borderRadius: radius.md, backgroundColor: '#FFF4DB' }, demoText: { flex: 1, color: colors.primaryBlue, fontSize: 12, lineHeight: 18 } });
