import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAuthStore } from '@/store/auth-store';
import { colors, radius } from '@/theme/colors';
import { InlineNotice } from '@/components/InlineNotice';

function PasswordField({
  value,
  onChangeText,
  shown,
  onToggle,
  placeholder,
  autoComplete,
}: {
  value: string;
  onChangeText: (value: string) => void;
  shown: boolean;
  onToggle: () => void;
  placeholder: string;
  autoComplete: 'current-password' | 'new-password';
}) {
  return <View style={styles.passwordField}><TextInput accessibilityLabel={placeholder} style={styles.passwordInput} placeholder={placeholder} placeholderTextColor={colors.muted} autoComplete={autoComplete} secureTextEntry={!shown} value={value} onChangeText={onChangeText} /><Pressable accessibilityRole="button" accessibilityLabel={shown ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} onPress={onToggle} style={styles.eyeButton}><Ionicons name={shown ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.muted} /></Pressable></View>;
}

export default function AuthScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const insets = useSafeAreaInsets();
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const loading = useAuthStore((state) => state.loading);
  const [mode, setMode] = useState<'login' | 'register'>(params.mode === 'register' ? 'register' : 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formError, setFormError] = useState('');
  const checks = [
    { label: '8 caractères minimum', valid: password.length >= 8 },
    { label: 'Majuscule et minuscule', valid: /[A-Z]/.test(password) && /[a-z]/.test(password) },
    { label: 'Au moins un chiffre', valid: /\d/.test(password) },
    { label: 'Au moins un symbole', valid: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((check) => check.valid).length;
  const matches = Boolean(password) && password === confirmation;

  async function submit() {
    setFormError('');
    try {
      if (mode === 'login') await login(email.trim(), password);
      else {
        if (!matches) throw new Error('Les mots de passe ne correspondent pas.');
        await register({ name: name.trim(), email: email.trim(), phone: phone.trim() || undefined, password });
      }
      router.replace('/home');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Vérifiez vos informations puis réessayez.');
    }
  }

  return <View style={[styles.page, { paddingTop: insets.top }]}><ScreenHeader title={mode === 'login' ? 'Connexion' : 'Créer un compte'} /><KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}><Text style={styles.title}>Votre espace Terrasse Bleue</Text><Text style={styles.subtitle}>{mode === 'login' ? 'Retrouvez vos commandes et passez à table.' : 'Créez votre compte client en quelques instants.'}</Text>{formError ? <InlineNotice title={mode === 'login' ? 'Connexion impossible' : 'Compte non créé'} message={formError} /> : null}{mode === 'register' ? <><TextInput accessibilityLabel="Nom complet" style={styles.input} placeholder="Nom complet" placeholderTextColor={colors.muted} value={name} onChangeText={setName} /><TextInput accessibilityLabel="Téléphone facultatif" style={styles.input} placeholder="Téléphone (facultatif)" placeholderTextColor={colors.muted} keyboardType="phone-pad" value={phone} onChangeText={setPhone} /></> : null}<TextInput accessibilityLabel="Adresse e-mail" style={styles.input} placeholder="Adresse e-mail" placeholderTextColor={colors.muted} autoCapitalize="none" autoComplete="email" keyboardType="email-address" value={email} onChangeText={setEmail} /><PasswordField value={password} onChangeText={setPassword} shown={showPassword} onToggle={() => setShowPassword((value) => !value)} placeholder="Mot de passe (8 caractères minimum)" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />{mode === 'register' ? <><PasswordField value={confirmation} onChangeText={setConfirmation} shown={showConfirmation} onToggle={() => setShowConfirmation((value) => !value)} placeholder="Confirmer le mot de passe" autoComplete="new-password" /><View style={styles.strength}><View style={styles.strengthTop}><Text style={styles.strengthTitle}>Sécurité du mot de passe</Text><Text style={[styles.strengthWord, score === 4 ? styles.strong : score >= 2 ? styles.medium : styles.weak]}>{score === 4 ? 'Fort' : score >= 2 ? 'Moyen' : 'Faible'}</Text></View><View style={styles.bars}>{[1, 2, 3, 4].map((level) => <View key={level} style={[styles.bar, score >= level && (score === 4 ? styles.barStrong : score >= 2 ? styles.barMedium : styles.barWeak)]} />)}</View>{checks.map((check) => <View key={check.label} style={styles.check}><Ionicons name={check.valid ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={check.valid ? colors.success : colors.muted} /><Text style={[styles.checkText, check.valid && styles.checkValid]}>{check.label}</Text></View>)}<View style={styles.check}><Ionicons name={matches ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={matches ? colors.success : colors.muted} /><Text style={[styles.checkText, matches && styles.checkValid]}>Les mots de passe correspondent</Text></View></View></> : null}<Button label={mode === 'login' ? 'Se connecter' : 'Créer mon compte'} loading={loading} disabled={!email.trim() || password.length < 8 || (mode === 'register' && (name.trim().length < 2 || !matches))} onPress={() => void submit()} /><Pressable accessibilityRole="button" onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setConfirmation(''); setFormError(''); }} style={styles.switch}><Text style={styles.switchText}>{mode === 'login' ? 'Nouveau client ? Créer un compte' : 'Déjà un compte ? Se connecter'}</Text></Pressable><Button label="Continuer en invité" variant="ghost" onPress={() => router.replace('/home')} /></ScrollView></KeyboardAvoidingView></View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.warmIvory }, keyboard: { flex: 1 }, content: { padding: 24, gap: 13 }, title: { marginTop: 30, color: colors.primaryBlue, fontSize: 28, fontWeight: '800' }, subtitle: { color: colors.muted, lineHeight: 22, marginBottom: 10 }, input: { minHeight: 54, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, paddingHorizontal: 15, color: colors.charcoal }, passwordField: { minHeight: 54, flexDirection: 'row', alignItems: 'center', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white }, passwordInput: { flex: 1, minHeight: 52, paddingHorizontal: 15, color: colors.charcoal }, eyeButton: { width: 52, minHeight: 52, alignItems: 'center', justifyContent: 'center' }, strength: { padding: 14, gap: 8, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white }, strengthTop: { flexDirection: 'row', justifyContent: 'space-between' }, strengthTitle: { color: colors.primaryBlue, fontWeight: '800' }, strengthWord: { fontWeight: '800' }, weak: { color: colors.danger }, medium: { color: colors.terracotta }, strong: { color: colors.success }, bars: { flexDirection: 'row', gap: 5 }, bar: { flex: 1, height: 5, borderRadius: 3, backgroundColor: colors.border }, barWeak: { backgroundColor: colors.danger }, barMedium: { backgroundColor: colors.terracotta }, barStrong: { backgroundColor: colors.success }, check: { flexDirection: 'row', alignItems: 'center', gap: 7 }, checkText: { color: colors.muted, fontSize: 12 }, checkValid: { color: colors.charcoal }, switch: { minHeight: 48, justifyContent: 'center', alignItems: 'center' }, switchText: { color: colors.turquoise, fontWeight: '700' },
});
