import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton, StarRow } from '../components';
import { colors, spacing } from '../theme';

const HEADLINES = ['Keep practising!', 'Level passed!', 'Great work!', 'Perfect run!'];

export default function ResultScreen({ navigation, params }) {
  const { level, worldSlug, worldTitle, levelResult, xpEarned } = params;
  const passedLevel = levelResult.stars >= 1;

  return (
    <View style={styles.container}>
      <Text style={styles.trophy}>{passedLevel ? '🏆' : '💪'}</Text>
      <Text style={styles.headline}>{HEADLINES[levelResult.stars]}</Text>
      <Text style={styles.levelTitle}>{level.title}</Text>
      <StarRow stars={levelResult.stars} size={44} />

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {levelResult.correctCount}/{levelResult.totalCount}
          </Text>
          <Text style={styles.statLabel}>correct</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>⚡ +{xpEarned}</Text>
          <Text style={styles.statLabel}>XP earned</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>🔥 {levelResult.currentStreak}</Text>
          <Text style={styles.statLabel}>day streak</Text>
        </View>
      </View>

      {!passedLevel ? (
        <Text style={styles.hint}>Get at least half right to earn a star and unlock the next level.</Text>
      ) : null}

      <View style={styles.buttons}>
        <PrimaryButton label="Back to map" onPress={navigation.goBack} />
        <PrimaryButton
          label="Try again"
          variant="ghost"
          onPress={() => navigation.replace('Quiz', { level, worldSlug, worldTitle })}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.large, gap: spacing.small },
  trophy: { fontSize: 72 },
  headline: { color: colors.text, fontSize: 30, fontWeight: '800' },
  levelTitle: { color: colors.mutedText, fontSize: 16, marginBottom: spacing.small },
  // alignSelf stretch: the parent centres its children, so without it the row shrinks and squeezes the boxes.
  statsRow: { flexDirection: 'row', alignSelf: 'stretch', gap: spacing.small, marginTop: spacing.large },
  statBox: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingVertical: spacing.medium,
    alignItems: 'center',
  },
  statValue: { color: colors.text, fontSize: 20, fontWeight: '800' },
  statLabel: { color: colors.mutedText, fontSize: 12, marginTop: 2 },
  hint: { color: colors.mutedText, textAlign: 'center', marginTop: spacing.medium },
  buttons: { alignSelf: 'stretch', gap: spacing.small, marginTop: spacing.large },
});
