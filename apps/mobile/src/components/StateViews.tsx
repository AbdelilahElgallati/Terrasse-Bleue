import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { colors } from '@/theme/colors';
import { ApiError } from '@/api/client';

export function LoadingState({ label = 'Chargement…' }: { label?: string }) {
  return <View style={styles.container}><ActivityIndicator color={colors.turquoise} /><Text style={styles.description}>{label}</Text></View>;
}

export function EmptyState({ title, description, actionLabel, onAction }: { title: string; description: string; actionLabel?: string; onAction?: () => void }) {
  return <View style={styles.container}><Ionicons name="basket-outline" size={42} color={colors.turquoise} /><Text style={styles.title}>{title}</Text><Text style={styles.description}>{description}</Text>{actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} style={styles.action} /> : null}</View>;
}

export function ErrorState({ error, onRetry }: { error?: unknown; onRetry?: () => void }) {
  const status = error instanceof ApiError ? error.status : 0;
  const content = status === 401
    ? { title: 'Session expirée', description: 'Reconnectez-vous pour continuer.' }
    : status === 403
      ? { title: 'Accès refusé', description: 'Votre compte ne permet pas cette action.' }
      : status === 404
        ? { title: 'Contenu introuvable', description: 'Cet élément n’est plus disponible.' }
        : status >= 500
          ? { title: 'Service momentanément indisponible', description: 'Le restaurant ne peut pas répondre pour le moment.' }
          : { title: 'Petit souci de connexion', description: 'Impossible de charger le contenu. Réessayez dans un instant.' };
  return <View style={styles.container}><Ionicons name="cloud-offline-outline" size={42} color={colors.terracotta} /><Text style={styles.title}>{content.title}</Text><Text style={styles.description}>{content.description}</Text>{onRetry ? <Button label="Réessayer" variant="secondary" onPress={onRetry} style={styles.action} /> : null}</View>;
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  title: { fontSize: 20, fontWeight: '800', color: colors.primaryBlue, textAlign: 'center' },
  description: { fontSize: 15, lineHeight: 22, color: colors.muted, textAlign: 'center' },
  action: { marginTop: 8, alignSelf: 'stretch' },
});
