import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/theme/colors';

type NoticeKind = 'error' | 'warning' | 'info' | 'success';

export function InlineNotice({ title, message, kind = 'error', actionLabel, onAction }: { title: string; message: string; kind?: NoticeKind; actionLabel?: string; onAction?: () => void }) {
  const tone = kind === 'error' ? colors.danger : kind === 'warning' ? colors.warning : kind === 'success' ? colors.success : colors.turquoise;
  const icon = kind === 'error' ? 'alert-circle' : kind === 'warning' ? 'warning' : kind === 'success' ? 'checkmark-circle' : 'information-circle';
  return <View accessibilityRole="alert" style={[styles.notice, { borderLeftColor: tone }]}><Ionicons name={icon} size={22} color={tone} /><View style={styles.copy}><Text style={[styles.title, { color: tone }]}>{title}</Text><Text style={styles.message}>{message}</Text>{actionLabel && onAction ? <Pressable accessibilityRole="button" onPress={onAction}><Text style={[styles.action, { color: tone }]}>{actionLabel} →</Text></Pressable> : null}</View></View>;
}

const styles = StyleSheet.create({
  notice: { flexDirection: 'row', gap: 11, padding: 14, borderRadius: radius.md, borderLeftWidth: 4, backgroundColor: colors.white },
  copy: { flex: 1, gap: 3 }, title: { fontWeight: '800', fontSize: 14 }, message: { color: colors.charcoal, lineHeight: 19 }, action: { marginTop: 5, fontWeight: '800' },
});
