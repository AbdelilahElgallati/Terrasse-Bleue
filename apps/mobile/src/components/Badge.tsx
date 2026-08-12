import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/theme/colors';

export type BadgeTone = 'teal' | 'green' | 'orange' | 'neutral' | 'blue' | 'red';

export function Badge({ label, tone = 'teal' }: { label: string; tone?: BadgeTone }) {
  return <View accessibilityRole="text" style={[styles.badge, styles[tone]]}><Text style={[styles.text, styles[`${tone}Text`]]}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  teal: { backgroundColor: colors.statusConfirmedSurface },
  green: { backgroundColor: colors.statusCompletedSurface },
  orange: { backgroundColor: colors.statusPreparingSurface },
  neutral: { backgroundColor: colors.statusPendingSurface },
  blue: { backgroundColor: colors.statusReadySurface },
  red: { backgroundColor: colors.statusCancelledSurface },
  text: { fontSize: 12, fontWeight: '700' },
  tealText: { color: colors.statusConfirmedText },
  greenText: { color: colors.statusCompletedText },
  orangeText: { color: colors.statusPreparingText },
  neutralText: { color: colors.charcoal },
  blueText: { color: colors.statusReadyText },
  redText: { color: colors.statusCancelledText },
});
