import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import CommentsSection from '../CommentsSection';
import { PrimaryButton, StarRow } from '../components';
import { playSound } from '../sound';
import { colors, spacing } from '../theme';

const HEADLINES = ['Keep practising!', 'Level passed!', 'Great work!', 'Perfect run!'];

export default function ResultScreen({ navigation, params }) {
  const { level, worldSlug, worldTitle, levelResult, xpEarned } = params;
  const passedLevel = levelResult.stars >= 1;
  const rankedUp = levelResult.rankedUp === true;

  useEffect(() => {
    playSound(rankedUp ? 'rankup' : passedLevel ? 'complete' : 'fail');
  }, [rankedUp, passedLevel]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.trophy}>{passedLevel ? '🏆' : '💪'}</Text>
      <Text style={styles.completeLabel}>{passedLevel ? 'LEVEL COMPLETE!' : 'NOT YET…'}</Text>
      <Text style={styles.headline}>{HEADLINES[levelResult.stars]}</Text>
      <Text style={styles.levelTitle}>{level.title}</Text>
      <StarRow stars={levelResult.stars} size={44} />

      {rankedUp && levelResult.rank ? (
        <View style={styles.rankUpBanner}>
          <Text style={styles.rankUpIcon}>{levelResult.rank.icon}</Text>
          <View style={styles.rankUpText}>
            <Text style={styles.rankUpLabel}>RANK UP!</Text>
            <Text style={styles.rankUpTitle}>You reached {levelResult.rank.title}</Text>
          </View>
        </View>
      ) : null}

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
        <PrimaryButton label="CONTINUE" variant="gold" onPress={navigation.goBack} />
        <PrimaryButton
          label="Try again"
          variant="ghost"
          onPress={() => navigation.replace('Quiz', { level, worldSlug, worldTitle })}
        />
      </View>

      <View style={styles.commentsArea}>
        <CommentsSection levelId={level.levelId} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: spacing.large, gap: spacing.small, paddingBottom: spacing.large * 2 },
  trophy: { fontSize: 72, marginTop: spacing.large },
  completeLabel: { color: colors.gold, fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  headline: { color: colors.text, fontSize: 32, fontWeight: '900' },
  levelTitle: { color: colors.mutedText, fontSize: 16, marginBottom: spacing.small },
  rankUpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: spacing.medium,
    backgroundColor: '#2a2160',
    borderColor: colors.gold,
    borderWidth: 2,
    borderRadius: 18,
    padding: spacing.medium,
    marginTop: spacing.medium,
  },
  rankUpIcon: { fontSize: 40 },
  rankUpText: { flex: 1 },
  rankUpLabel: { color: colors.gold, fontWeight: '900', letterSpacing: 2, fontSize: 13 },
  rankUpTitle: { color: colors.text, fontWeight: '900', fontSize: 18 },
  // alignSelf stretch: the parent centres its children, so without it the row shrinks and squeezes the boxes.
  statsRow: { flexDirection: 'row', alignSelf: 'stretch', gap: spacing.small, marginTop: spacing.large },
  statBox: {
    flex: 1,
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: spacing.medium,
    alignItems: 'center',
  },
  statValue: { color: colors.text, fontSize: 20, fontWeight: '800' },
  statLabel: { color: colors.mutedText, fontSize: 12, marginTop: 2 },
  hint: { color: colors.mutedText, textAlign: 'center', marginTop: spacing.medium },
  buttons: { alignSelf: 'stretch', gap: spacing.small, marginTop: spacing.large },
  commentsArea: { alignSelf: 'stretch', marginTop: spacing.large },
});
