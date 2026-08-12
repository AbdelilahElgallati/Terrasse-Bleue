import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';

export function ScreenHeader({ title, back = true, right }: { title: string; back?: boolean; right?: React.ReactNode }) {
  const router = useRouter();
  return (
    <View style={styles.container}>
      {back ? (
        <Pressable accessibilityLabel="Retour" onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="chevron-back" size={24} color={colors.primaryBlue} />
        </Pressable>
      ) : <View style={styles.iconButton} />}
      <Text numberOfLines={1} style={styles.title}>{title}</Text>
      <View style={styles.iconButton}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { minHeight: 58, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.warmIvory },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', fontSize: 19, fontWeight: '800', color: colors.primaryBlue },
});
