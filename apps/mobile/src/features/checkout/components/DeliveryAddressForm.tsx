import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius } from '@/theme/colors';
import type { DeliveryAddressDraft, DeliveryAddressErrors } from '../types';

type Props = { value: DeliveryAddressDraft; errors: DeliveryAddressErrors; onChange: (value: DeliveryAddressDraft) => void };

export function DeliveryAddressForm({ value, errors, onChange }: Props) {
  const field = (key: keyof DeliveryAddressDraft, text: string) => onChange({ ...value, [key]: text });
  return <View style={styles.card}>
    <Text style={styles.title}>Adresse de livraison</Text>
    <Text style={styles.notice}>Livraison disponible dans toute la ville d’Essaouira. Cette adresse sert uniquement à cette commande.</Text>
    <Field label="Nom du destinataire" required error={errors.recipientName}><TextInput value={value.recipientName} onChangeText={(text) => field('recipientName', text)} autoComplete="name" maxLength={100} placeholder="Ex. Yasmine Alaoui" placeholderTextColor={colors.muted} style={[styles.input, errors.recipientName && styles.invalid]} /></Field>
    <Field label="Téléphone" required error={errors.phone}><TextInput value={value.phone} onChangeText={(text) => field('phone', text)} autoComplete="tel" keyboardType="phone-pad" maxLength={20} placeholder="Ex. 06 00 00 00 00" placeholderTextColor={colors.muted} style={[styles.input, errors.phone && styles.invalid]} /></Field>
    <Field label="Adresse" required error={errors.addressLine}><TextInput value={value.addressLine} onChangeText={(text) => field('addressLine', text)} autoComplete="street-address" maxLength={180} placeholder="Rue, résidence, numéro…" placeholderTextColor={colors.muted} style={[styles.input, errors.addressLine && styles.invalid]} /></Field>
    <View style={styles.twoColumns}><Field label="Quartier"><TextInput value={value.neighborhood} onChangeText={(text) => field('neighborhood', text)} maxLength={80} placeholder="Facultatif" placeholderTextColor={colors.muted} style={styles.input} /></Field><Field label="Ville"><TextInput value={value.city} editable={false} style={[styles.input, styles.readonly]} /></Field></View>
    <Field label="Point de repère"><TextInput value={value.landmark} onChangeText={(text) => field('landmark', text)} maxLength={120} placeholder="Près de… (facultatif)" placeholderTextColor={colors.muted} style={styles.input} /></Field>
    <Field label="Instructions au livreur"><TextInput value={value.instructions} onChangeText={(text) => field('instructions', text)} multiline maxLength={240} placeholder="Étage, porte, indication…" placeholderTextColor={colors.muted} style={[styles.input, styles.multiline]} /></Field>
  </View>;
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return <View style={styles.field}><Text style={styles.label}>{label}{required ? ' *' : ''}</Text>{children}{error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}</View>;
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 13, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  title: { color: colors.primaryBlue, fontSize: 17, fontWeight: '800' },
  notice: { padding: 12, borderRadius: radius.sm, backgroundColor: colors.paleTurquoise, color: colors.primaryBlue, fontSize: 12, lineHeight: 18 },
  field: { flex: 1, gap: 6 }, label: { color: colors.primaryBlue, fontSize: 13, fontWeight: '700' },
  input: { minHeight: 48, paddingHorizontal: 13, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.warmIvory, color: colors.charcoal, fontSize: 15 },
  invalid: { borderColor: colors.danger }, readonly: { color: colors.muted, backgroundColor: colors.paleTurquoise }, multiline: { minHeight: 82, paddingTop: 13, textAlignVertical: 'top' },
  error: { color: colors.danger, fontSize: 12, lineHeight: 17 }, twoColumns: { flexDirection: 'row', gap: 10 },
});

