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
    body = (
      <ScrollView contentContainerStyle={styles.mapContent}>
        {levels.map((level, levelIndex) => {
          // Zig-zag the nodes left and right so the levels look like a path on a map.
          const nodeAlignment = levelIndex % 2 === 0 ? 'flex-start' : 'flex-end';
          return (
            <View key={level.levelId} style={{ alignItems: nodeAlignment }}>
              {levelIndex > 0 ? <View style={styles.pathConnector} /> : null}
              <Pressable
                disabled={!level.isUnlocked}
                onPress={() => openLevel(level)}
                style={({ pressed }) => [
                  styles.levelNode,
                  level.isBoss && styles.bossNode,
                  !level.isUnlocked && styles.lockedNode,
                  pressed && styles.pressedNode,
                ]}
              >
                <Text style={styles.levelIcon}>{!level.isUnlocked ? '🔒' : level.isBoss ? '👑' : level.levelOrder}</Text>
                <View style={styles.levelInfo}>
                  <Text style={styles.levelTitle}>{level.title}</Text>
                  <Text style={styles.levelMeta}>
                    {level.questionCount} questions
                    {level.timeLimitSeconds ? ` · ${level.timeLimitSeconds / 60} min` : ''}
                  </Text>
                  <StarRow stars={level.stars} size={14} />
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
      <ScreenHeader title={worldTitle} onBack={navigation.goBack} />
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapContent: { padding: spacing.large },
  pathConnector: {
    width: 4,
    height: 28,
    backgroundColor: colors.cardBorder,
    alignSelf: 'center',
    borderRadius: 2,
    marginVertical: 4,
  },
  levelNode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medium,
    width: '78%',
    backgroundColor: colors.card,
    borderColor: colors.primary,
    borderWidth: 2,
    borderRadius: 18,
    padding: spacing.medium,
  },
  bossNode: { borderColor: colors.gold },
  lockedNode: { borderColor: colors.locked, opacity: 0.55 },
  pressedNode: { opacity: 0.7 },
  levelIcon: { color: colors.text, fontSize: 24, fontWeight: '800', width: 36, textAlign: 'center' },
  levelInfo: { flex: 1, gap: 2 },
  levelTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  levelMeta: { color: colors.mutedText, fontSize: 12 },
});
