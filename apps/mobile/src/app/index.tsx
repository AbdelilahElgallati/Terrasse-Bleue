import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/store/auth-store';
import { colors } from '@/theme/colors';

const logo = require('../../assets/terrasse-bleue-mark-contrast.png');
const lightLogo = require('../../assets/terrasse-bleue-logo.png');

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const initialized = useAuthStore((state) => state.initialized);
  const user = useAuthStore((state) => state.user);

  if (!initialized) {
    return <View style={styles.splash}><Image source={logo} resizeMode="contain" style={styles.splashLogo} /><Text style={styles.splashText}>ESSAOUIRA · MAROC</Text></View>;
  }
  if (user) return <Redirect href="/home" />;

  return (
    <ScrollView style={styles.background} contentContainerStyle={[styles.page, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.shell}>
        <View style={styles.brand}>
          <Image source={lightLogo} resizeMode="contain" style={styles.logo} />
          <Text style={styles.eyebrow}>TERRASSE BLEUE · ESSAOUIRA</Text>
        </View>

        <View style={styles.heroCopy}>
          <Text style={styles.title}>Le plaisir de bien manger, simplement.</Text>
          <Text style={styles.subtitle}>Découvrez la carte, commandez simplement et profitez du moment.</Text>
        </View>

        <View style={styles.promise}>
          <Ionicons name="sparkles-outline" size={20} color={colors.terracotta} />
          <Text style={styles.promiseText}>Cuisine fraîche · commande rapide · suivi en direct</Text>
        </View>

        <View style={styles.actions}>
          <Button label="Se connecter" onPress={() => router.push({ pathname: '/auth', params: { mode: 'login' } })} />
          <Button label="Créer un compte" variant="secondary" onPress={() => router.push({ pathname: '/auth', params: { mode: 'register' } })} />
        </View>

        <Pressable accessibilityRole="button" onPress={() => router.replace('/home')} style={styles.guestButton}>
          <Text style={styles.guestText}>Découvrir le menu en invité</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.primaryBlue} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryBlue },
  splashLogo: { width: '60%', maxWidth: 240, aspectRatio: 1 },
  splashText: { color: colors.sand, letterSpacing: 2.2, fontSize: 11, fontWeight: '800' },
  background: { flex: 1, backgroundColor: colors.warmIvory },
  page: { flexGrow: 1, paddingHorizontal: 24, justifyContent: 'center', alignItems: 'center' },
  shell: { width: '100%', maxWidth: 440, alignItems: 'stretch' },
  brand: { alignItems: 'center' },
  logo: { width: 132, height: 112 },
  eyebrow: { marginTop: 2, textAlign: 'center', color: colors.terracotta, fontSize: 10, letterSpacing: 1.7, fontWeight: '800' },
  heroCopy: { marginTop: 28, alignItems: 'center' },
  title: { textAlign: 'center', color: colors.primaryBlue, fontSize: 35, lineHeight: 40, fontWeight: '800' },
  subtitle: { maxWidth: 360, marginTop: 12, textAlign: 'center', color: colors.muted, fontSize: 15, lineHeight: 22 },
  promise: { marginTop: 26, minHeight: 48, paddingHorizontal: 15, alignSelf: 'center', borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  promiseText: { color: colors.charcoal, fontSize: 12, fontWeight: '600' },
  actions: { marginTop: 28, gap: 11 },
  guestButton: { minHeight: 50, marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  guestText: { color: colors.primaryBlue, fontSize: 14, fontWeight: '700' },
});
