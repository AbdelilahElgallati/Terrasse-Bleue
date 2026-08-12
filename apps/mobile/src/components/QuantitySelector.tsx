import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/theme/colors';

export function QuantitySelector({ value, onDecrease, onIncrease, compact = false }: { value: number; onDecrease: () => void; onIncrease: () => void; compact?: boolean }) {
  const size = 44;
  return (
    <View style={styles.container}>
      <Pressable accessibilityLabel="Diminuer la quantité" onPress={onDecrease} style={[styles.button, { width: size, height: size }]}>
        <Ionicons name="remove" size={20} color={colors.primaryBlue} />
      </Pressable>
      <Text accessibilityLabel={`Quantité ${value}`} style={styles.value}>{value}</Text>
      <Pressable accessibilityLabel="Augmenter la quantité" onPress={onIncrease} style={[styles.button, { width: size, height: size }]}>
        <Ionicons name="add" size={20} color={colors.primaryBlue} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  button: { borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  value: { minWidth: 22, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.charcoal },
});
