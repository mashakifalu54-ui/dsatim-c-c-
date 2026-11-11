// Small building blocks shared by several screens.
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from './theme';

const BUTTON_COLORS = {
  primary: { face: colors.primary, edge: colors.primaryDark },
  success: { face: colors.success, edge: colors.successDark },
  danger: { face: colors.danger, edge: colors.dangerDark },
  gold: { face: colors.gold, edge: colors.goldDark },
  ghost: { face: colors.card, edge: colors.cardBorder },
};

// A chunky button with a darker "edge" underneath, like buttons in most game apps.
export function PrimaryButton({ label, onPress, disabled = false, variant = 'primary' }) {
  const { face, edge } = BUTTON_COLORS[variant];
  const labelColor = variant === 'gold' || variant === 'success' ? colors.background : colors.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: face, borderBottomColor: edge },
        pressed && styles.buttonPressed,
        disabled && styles.buttonDimmed,
      ]}
    >
      <Text style={[styles.buttonLabel, { color: labelColor }]}>{label}</Text>
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

export function ScreenHeader({ title, onBack, rightLabel }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} hitSlop={12} style={styles.backButton}>
        <Text style={styles.backArrow}>‹</Text>
      </Pressable>
      <Text style={styles.headerTitle} numberOfLines={1}>
        {title}
      </Text>
      {rightLabel ? <Text style={styles.headerChip}>{rightLabel}</Text> : null}
    </View>
  );
}

export function ProgressBar({ ratio, color = colors.success, height = 8 }) {
  const clampedRatio = Math.max(0, Math.min(1, ratio));
  return (
    <View style={[styles.progressTrack, { height, borderRadius: height / 2 }]}>
      <View style={{ width: `${clampedRatio * 100}%`, height, borderRadius: height / 2, backgroundColor: color }} />
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

// Renders level notes. Lines starting with "## " are headings, "• " are bullets.
export function NotesText({ notes }) {
  const noteLines = String(notes ?? '').split('\n').filter((noteLine) => noteLine.trim().length > 0);
  return (
    <View style={styles.notesBox}>
      {noteLines.map((noteLine, lineIndex) => {
        if (noteLine.startsWith('## ')) {
          return (
            <Text key={lineIndex} style={styles.notesHeading}>
              {noteLine.slice(3)}
            </Text>
          );
        }
        if (noteLine.startsWith('• ')) {
          return (
            <View key={lineIndex} style={styles.notesBulletRow}>
              <Text style={styles.notesBulletDot}>•</Text>
              <Text style={styles.notesText}>{noteLine.slice(2)}</Text>
            </View>
          );
        }
        return (
          <Text key={lineIndex} style={styles.notesText}>
            {noteLine}
          </Text>
        );
      })}
    </View>
  );
}

export function RankBadge({ rank, compact = false }) {
  if (!rank) return null;
  return (
    <View style={[styles.rankBadge, compact && styles.rankBadgeCompact]}>
      <Text style={compact ? styles.rankIconCompact : styles.rankIcon}>{rank.icon}</Text>
      <Text style={[styles.rankTitle, compact && styles.rankTitleCompact]}>{rank.title}</Text>
    </View>
  );
}

const TABS = [
  { screenName: 'Home', icon: '🗺️', label: 'Quests' },
  { screenName: 'Community', icon: '💬', label: 'Community' },
  { screenName: 'Profile', icon: '👤', label: 'Profile' },
];

export function TabBar({ activeScreen, onSelect }) {
  return (
    <View style={styles.tabBar}>
      {TABS.map((tab) => {
        const isActive = tab.screenName === activeScreen;
        return (
          <Pressable key={tab.screenName} style={styles.tabButton} onPress={() => onSelect(tab.screenName)}>
            <Text style={[styles.tabIcon, !isActive && styles.tabInactive]}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: spacing.large,
    borderRadius: 16,
    alignItems: 'center',
    borderBottomWidth: 4,
  },
  buttonPressed: { transform: [{ translateY: 2 }], borderBottomWidth: 2 },
  buttonDimmed: { opacity: 0.45 },
  buttonLabel: { fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.large, gap: spacing.medium },
  errorText: { color: colors.mutedText, fontSize: 16, textAlign: 'center' },
  starRow: { flexDirection: 'row' },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.medium, padding: spacing.medium },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: { color: colors.text, fontSize: 26, lineHeight: 30, marginTop: -2 },
  headerTitle: { color: colors.text, fontSize: 20, fontWeight: '800', flex: 1 },
  headerChip: {
    color: colors.gold,
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    overflow: 'hidden',
  },
  progressTrack: { backgroundColor: colors.locked, overflow: 'hidden' },
  notesBox: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 20,
    padding: spacing.medium,
    gap: 6,
  },
  notesHeading: { color: colors.gold, fontSize: 15, fontWeight: '900', marginTop: 6, letterSpacing: 0.3 },
  notesBulletRow: { flexDirection: 'row', gap: 8 },
  notesBulletDot: { color: colors.primary, fontSize: 15, lineHeight: 22, fontWeight: '900' },
  notesText: { color: colors.text, fontSize: 15, lineHeight: 22, flex: 1 },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#2a2160',
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  rankBadgeCompact: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 10, gap: 3 },
  rankIcon: { fontSize: 16 },
  rankIconCompact: { fontSize: 11 },
  rankTitle: { color: colors.text, fontWeight: '800', fontSize: 13 },
  rankTitleCompact: { fontSize: 11 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderTopColor: colors.cardBorder,
    borderTopWidth: 1,
    paddingVertical: 6,
  },
  tabButton: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  tabIcon: { fontSize: 22 },
  tabInactive: { opacity: 0.45 },
  tabLabel: { color: colors.mutedText, fontSize: 11, fontWeight: '700', marginTop: 2 },
  tabLabelActive: { color: colors.gold },
});
