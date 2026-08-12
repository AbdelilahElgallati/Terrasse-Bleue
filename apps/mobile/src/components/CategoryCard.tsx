import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Category } from '@/types/menu';
import { colors, radius } from '@/theme/colors';
import { SafeImage } from './SafeImage';

export function CategoryCard({ category, selected, onPress }: { category: Category; selected?: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => [styles.card, selected && styles.selected, pressed && styles.pressed]}>
      {category.image ? <SafeImage source={category.image} style={styles.image} accessibilityLabel={`Illustration ${category.name}`} /> : <View style={styles.icon}><Ionicons name={category.icon as keyof typeof Ionicons.glyphMap} size={22} color={selected ? colors.white : colors.turquoise} /></View>}
      <Text numberOfLines={1} style={[styles.label, selected && styles.selectedLabel]}>{category.name}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { minWidth: 104, minHeight: 78, padding: 12, borderRadius: radius.md, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', gap: 8 },
  selected: { backgroundColor: colors.primaryBlue, borderColor: colors.primaryBlue },
  label: { color: colors.charcoal, fontSize: 13, fontWeight: '700' },
  selectedLabel: { color: colors.white },
  image: { width: 34, height: 34, borderRadius: 10 }, icon: { width: 34, height: 34, justifyContent: 'center' },
  pressed: { opacity: 0.86 },
});
