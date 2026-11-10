// Small building blocks shared by several screens.
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from './theme';

export function PrimaryButton({ label, onPress, disabled = false, variant = 'primary' }) {
  const backgroundColor = { primary: colors.primary, success: colors.success, danger: colors.danger, ghost: colors.card }[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.button, { backgroundColor }, (disabled || pressed) && styles.buttonDimmed]}
    >
      <Text style={styles.buttonLabel}>{label}</Text>
    </Pressable>
  );
}

export function LoadingView() {
  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export function ErrorView({ message, onRetry }) {
  return (
    <View style={styles.centered}>
      <Text style={styles.errorText}>{message}</Text>
      <PrimaryButton label="Try again" onPress={onRetry} />
    </View>
  );
}

export function ScreenHeader({ title, onBack }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} hitSlop={12}>
        <Text style={styles.backArrow}>←</Text>
      </Pressable>
      <Text style={styles.headerTitle} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}

export function StarRow({ stars, size = 18 }) {
  return (
    // Each star is its own Text inside a row: Android ignores opacity on Text nested in Text.
    <View style={styles.starRow}>
      {[1, 2, 3].map((starNumber) => (
        <Text key={starNumber} style={{ fontSize: size, opacity: starNumber <= stars ? 1 : 0.2 }}>
          ⭐
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  button: { paddingVertical: 14, paddingHorizontal: spacing.large, borderRadius: 14, alignItems: 'center' },
  buttonDimmed: { opacity: 0.5 },
  buttonLabel: { color: colors.text, fontSize: 16, fontWeight: '700' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.large, gap: spacing.medium },
  errorText: { color: colors.mutedText, fontSize: 16, textAlign: 'center' },
  starRow: { flexDirection: 'row' },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.medium, padding: spacing.medium },
  backArrow: { color: colors.text, fontSize: 26 },
  headerTitle: { color: colors.text, fontSize: 20, fontWeight: '700', flex: 1 },
});
