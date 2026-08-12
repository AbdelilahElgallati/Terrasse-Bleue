import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { ORDER_STATUS_PRESENTATION, ORDER_STATUS_SEQUENCE } from '@terrasse-bleue/types';
import type { OrderStatus as OrderStatusType } from '@/types/menu';
import { colors } from '@/theme/colors';
import type { BadgeTone } from './Badge';

const steps = ORDER_STATUS_SEQUENCE.map((status) => ({
  status,
  label: ORDER_STATUS_PRESENTATION[status].customerLabel,
  detail: ORDER_STATUS_PRESENTATION[status].customerMessage,
}));

export function OrderStatus({ status }: { status: OrderStatusType }) {
  if (status === 'CANCELLED') {
    return <View accessibilityRole="alert" style={styles.cancelled}><Ionicons name="close-circle" size={24} color={colors.danger} /><Text style={styles.cancelledText}>{ORDER_STATUS_PRESENTATION.CANCELLED.customerLabel}</Text></View>;
  }
  const current = ORDER_STATUS_PRESENTATION[status].timelinePosition ?? -1;
  return (
    <View accessibilityLabel={`${ORDER_STATUS_PRESENTATION[status].customerLabel}. ${ORDER_STATUS_PRESENTATION[status].customerMessage}`}>
      {steps.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <View key={step.status} style={styles.row}>
            <View style={styles.rail} accessible={false}>
              <View style={[styles.circle, done && styles.doneCircle, active && styles.activeCircle]}>
                {done ? <Ionicons name="checkmark" size={17} color={colors.white} /> : active ? <View style={styles.dot} /> : null}
              </View>
              {index < steps.length - 1 ? <View style={[styles.line, index < current && styles.doneLine]} /> : null}
            </View>
            <View style={styles.copy} accessible={false}>
              <Text style={[styles.label, (done || active) && styles.strongLabel]}>{step.label}</Text>
              {active ? <Text style={styles.detail}>{step.detail}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function statusLabel(status: OrderStatusType) {
  return ORDER_STATUS_PRESENTATION[status].shortLabel;
}

export function statusTone(status: OrderStatusType): BadgeTone {
  return ({ pending: 'neutral', confirmed: 'teal', preparing: 'orange', ready: 'blue', completed: 'green', cancelled: 'red' } as const)[
    ORDER_STATUS_PRESENTATION[status].tone
  ];
}

const styles = StyleSheet.create({
  row: { minHeight: 76, flexDirection: 'row' },
  rail: { width: 42, alignItems: 'center' },
  circle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  doneCircle: { backgroundColor: colors.success, borderColor: colors.success },
  activeCircle: { borderColor: colors.terracotta, borderWidth: 3 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.terracotta },
  line: { flex: 1, width: 2, backgroundColor: colors.border },
  doneLine: { backgroundColor: colors.success },
  copy: { flex: 1, paddingBottom: 18 },
  label: { color: colors.muted, fontSize: 16, fontWeight: '600' },
  strongLabel: { color: colors.primaryBlue, fontWeight: '800' },
  detail: { color: colors.muted, lineHeight: 20, marginTop: 4 },
  cancelled: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 16 },
  cancelledText: { color: colors.danger, fontSize: 17, fontWeight: '800' },
});
