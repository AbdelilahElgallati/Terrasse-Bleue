import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { DemoOrder } from '@/types/menu';
import { Badge } from './Badge';
import { statusLabel, statusTone } from './OrderStatus';
import { colors, radius } from '@/theme/colors';
import { formatPrice } from '@/utils/currency';

export function OrderCard({ order, onPress }: { order: DemoOrder; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.header}><View><Text style={styles.number}>{order.number}</Text><Text style={styles.date}>{order.date}</Text></View><Badge label={statusLabel(order.status)} tone={statusTone(order.status)} /></View>
      <Text numberOfLines={2} style={styles.items}>{order.items.map((item) => `${item.quantity}× ${item.name}`).join(' · ')}</Text>
      <View style={styles.footer}><Text style={styles.total}>{formatPrice(order.total)}</Text><Text style={styles.link}>Voir le détail →</Text></View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { padding: 18, borderRadius: radius.lg, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, gap: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  number: { color: colors.primaryBlue, fontSize: 18, fontWeight: '800' },
  date: { color: colors.muted, marginTop: 3, fontSize: 13 },
  items: { color: colors.charcoal, lineHeight: 20 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  total: { fontWeight: '800', color: colors.charcoal },
  link: { color: colors.turquoise, fontWeight: '700' },
});
