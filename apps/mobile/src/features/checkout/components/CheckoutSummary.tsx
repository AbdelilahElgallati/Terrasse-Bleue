import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/theme/colors';
import { formatPrice } from '@/utils/currency';

export function CheckoutSummary({ subtotal, deliveryFee, total, demo }: { subtotal: number; deliveryFee: number; total: number; demo: boolean }) {
  return <View style={styles.card}>
    <View style={styles.row}><Text style={styles.label}>Sous-total</Text><Text style={styles.value}>{formatPrice(subtotal)}</Text></View>
    {deliveryFee ? <View style={styles.row}><Text style={styles.label}>Livraison à Essaouira</Text><Text style={styles.value}>{formatPrice(deliveryFee)}</Text></View> : null}
    <View style={styles.divider} /><View style={styles.row}><Text style={styles.totalLabel}>Total</Text><Text style={styles.total}>{formatPrice(total)}</Text></View>
    <Text style={styles.hint}>Le restaurant revérifie les disponibilités et les prix avant l’enregistrement.</Text>
  </View>;
}

const styles = StyleSheet.create({ card: { marginTop: 22, padding: 18, gap: 10, borderRadius: radius.lg, backgroundColor: colors.primaryBlue }, row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 }, label: { color: colors.paleTurquoise }, value: { color: colors.white, fontWeight: '700' }, divider: { height: 1, backgroundColor: 'rgba(255,255,255,.2)' }, totalLabel: { color: colors.white, fontWeight: '800', fontSize: 17 }, total: { color: colors.white, fontWeight: '800', fontSize: 21 }, hint: { color: colors.paleTurquoise, fontSize: 12, lineHeight: 17 } });
