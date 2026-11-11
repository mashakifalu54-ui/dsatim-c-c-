import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { fetchLevels } from '../api';
import { ErrorView, LoadingView, ScreenHeader, StarRow } from '../components';
import { colors, spacing } from '../theme';

export default function WorldScreen({ navigation, params }) {
  const { worldSlug, worldTitle } = params;
  const [levels, setLevels] = useState([]);
  const [loadState, setLoadState] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const loadLevels = useCallback(async () => {
    setLoadState('loading');
    try {
      setLevels(await fetchLevels(worldSlug));
      setLoadState('ready');
    } catch (error) {
      setErrorMessage(error.message);
      setLoadState('error');
    }
  }, [worldSlug]);

  useEffect(() => {
    loadLevels();
  }, [loadLevels]);

  function openLevel(level) {
    navigation.push('Quiz', { level, worldSlug, worldTitle });
  }

  let body;
  if (loadState === 'loading') body = <LoadingView />;
  else if (loadState === 'error') body = <ErrorView message={errorMessage} onRetry={loadLevels} />;
  else {
    // The first level that is unlocked but has no stars yet is "You are here".
    const currentLevel = levels.find((level) => level.isUnlocked && level.stars === 0);
    body = (
      <ScrollView contentContainerStyle={styles.mapContent}>
        {levels.map((level, levelIndex) => {
          // Wind the path left and right, like the level map in the design mockup.
          const windOffset = [0, 44, 0, -44][levelIndex % 4];
          const isCurrent = currentLevel && currentLevel.levelId === level.levelId;
          return (
            <View key={level.levelId} style={styles.levelRow}>
              {levelIndex > 0 ? <View style={[styles.pathConnector, { marginLeft: windOffset }]} /> : null}
              <Pressable
                disabled={!level.isUnlocked}
                onPress={() => openLevel(level)}
                style={({ pressed }) => [styles.levelStop, { marginLeft: windOffset }, pressed && styles.pressedNode]}
              >
                <View
                  style={[
                    styles.levelCircle,
                    level.isBoss && styles.bossCircle,
                    level.stars > 0 && styles.doneCircle,
                    isCurrent && styles.currentCircle,
                    !level.isUnlocked && styles.lockedCircle,
                  ]}
                >
                  <Text style={styles.levelIcon}>{!level.isUnlocked ? '🔒' : level.isBoss ? '👑' : level.levelOrder}</Text>
                </View>
                <View style={styles.levelLabel}>
                  <Text style={[styles.levelTitle, !level.isUnlocked && styles.lockedText]} numberOfLines={2}>
                    {level.title}
                  </Text>
                  <Text style={styles.levelMeta}>
                    {level.questionCount} questions
                    {level.timeLimitSeconds ? ` · ${level.timeLimitSeconds / 60} min` : ''}
                  </Text>
                  {level.isUnlocked ? <StarRow stars={level.stars} size={14} /> : null}
                  {isCurrent ? <Text style={styles.hereBadge}>YOU ARE HERE</Text> : null}
                </View>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title={worldTitle} onBack={navigation.goBack} rightLabel={`${levels.length} levels`} />
      {body}
    </View>
  );
}

const CIRCLE_SIZE = 64;

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapContent: { paddingVertical: spacing.large, paddingHorizontal: spacing.large, paddingBottom: spacing.large * 2 },
  levelRow: { alignItems: 'center' },
  pathConnector: { width: 6, height: 26, backgroundColor: colors.cardBorder, borderRadius: 3, marginVertical: 4 },
  levelStop: { flexDirection: 'row', alignItems: 'center', gap: spacing.medium, width: '86%' },
  pressedNode: { opacity: 0.7 },
  levelCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneCircle: { backgroundColor: colors.successDark, borderColor: colors.success },
  currentCircle: { backgroundColor: colors.primary, borderColor: colors.gold, borderWidth: 5 },
  bossCircle: { backgroundColor: colors.goldDark, borderColor: colors.gold },
  lockedCircle: { backgroundColor: colors.locked, borderColor: colors.cardBorder },
  levelIcon: { color: colors.text, fontSize: 24, fontWeight: '900' },
  levelLabel: { flex: 1, gap: 2 },
  levelTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  lockedText: { color: colors.mutedText },
  levelMeta: { color: colors.mutedText, fontSize: 12 },
  hereBadge: {
    alignSelf: 'flex-start',
    color: colors.background,
    backgroundColor: colors.gold,
    fontSize: 10,
    fontWeight: '900',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
    marginTop: 2,
  },
});
