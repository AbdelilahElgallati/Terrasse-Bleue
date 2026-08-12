import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, typography } from '@/theme/colors';

type Props = Omit<PressableProps, 'style'> & {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, variant = 'primary', loading, disabled, style, ...props }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      style={({ pressed }) => [styles.base, styles[variant], pressed && styles.pressed, disabled && styles.disabled, style]}
      {...props}
    >
      {loading ? <ActivityIndicator color={variant === 'primary' ? colors.white : colors.primaryBlue} /> : (
        <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 52, paddingHorizontal: 20, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  primary: { backgroundColor: colors.primaryBlue },
  secondary: { backgroundColor: colors.paleTurquoise, borderWidth: 1, borderColor: colors.turquoise },
  ghost: { backgroundColor: 'transparent' },
  label: typography.label,
  primaryLabel: { color: colors.white },
  secondaryLabel: { color: colors.primaryBlue },
  ghostLabel: { color: colors.primaryBlue },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.45 },
});
