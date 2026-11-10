import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { fetchPlayer, fetchWorlds } from '../api';
import { ErrorView, LoadingView } from '../components';
import { colors, spacing } from '../theme';

const WORLD_ICONS = { os: '🖥️', arch: '⚙️', web: '🌐', sql: '🗄️', dsa: '⛰️' };

export default function HomeScreen({ navigation }) {
  const [player, setPlayer] = useState(null);
  const [worlds, setWorlds] = useState([]);
  const [loadState, setLoadState] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  const loadHomeData = useCallback(async () => {
    try {
      const [loadedPlayer, loadedWorlds] = await Promise.all([fetchPlayer(), fetchWorlds()]);
      setPlayer(loadedPlayer);
      setWorlds(loadedWorlds);
      setLoadState('ready');
    } catch (error) {
      setErrorMessage(error.message);
      setLoadState('error');
    }
  }, []);

  useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);

  if (loadState === 'loading') return <LoadingView />;
  if (loadState === 'error') {
    return (
      <ErrorView
        message={errorMessage}
        onRetry={() => {
          setLoadState('loading');
          loadHomeData();
        }}
      />
    );
  }

  function renderWorldCard({ item: world }) {
    const progressRatio = world.levelCount === 0 ? 0 : world.completedLevels / world.levelCount;
    return (
      <Pressable
        style={({ pressed }) => [styles.worldCard, pressed && styles.worldCardPressed]}
        onPress={() => navigation.push('World', { worldSlug: world.slug, worldTitle: world.title })}
      >
        <Text style={styles.worldIcon}>{WORLD_ICONS[world.slug] ?? '📘'}</Text>
        <View style={styles.worldInfo}>
          <View style={styles.worldTitleRow}>
            <Text style={styles.worldTitle}>{world.title}</Text>
            {world.isNovemberPriority ? <Text style={styles.priorityBadge}>NOV</Text> : null}
          </View>
          <Text style={styles.worldDescription}>{world.description}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressRatio * 100}%` }]} />
          </View>
          <Text style={styles.worldProgressText}>
            {world.completedLevels}/{world.levelCount} levels · ⭐ {world.totalStars}
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <FlatList
      data={worlds}
      keyExtractor={(world) => world.slug}
      renderItem={renderWorldCard}
      contentContainerStyle={styles.listContent}
      refreshControl={<RefreshControl refreshing={false} onRefresh={loadHomeData} tintColor={colors.primary} />}
      ListHeaderComponent={
        <View>
          <Text style={styles.greeting}>Hi, {player.displayName} 👋</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>⚡ {player.totalXp}</Text>
              <Text style={styles.statLabel}>XP</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>🔥 {player.currentStreak}</Text>
              <Text style={styles.statLabel}>{player.playedToday ? 'day streak' : 'play today!'}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>🏆 {player.longestStreak}</Text>
              <Text style={styles.statLabel}>best streak</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Worlds</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: { padding: spacing.medium, gap: spacing.medium },
  greeting: { color: colors.text, fontSize: 26, fontWeight: '800' },
  statsRow: { flexDirection: 'row', gap: spacing.small, marginTop: spacing.medium },
  statBox: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingVertical: spacing.medium,
    alignItems: 'center',
  },
  statValue: { color: colors.text, fontSize: 20, fontWeight: '800' },
  statLabel: { color: colors.mutedText, fontSize: 12, marginTop: 2 },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '700', marginTop: spacing.large },
  worldCard: {
    flexDirection: 'row',
    gap: spacing.medium,
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 18,
    padding: spacing.medium,
  },
  worldCardPressed: { opacity: 0.7 },
  worldIcon: { fontSize: 36 },
  worldInfo: { flex: 1 },
  worldTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.small },
  worldTitle: { color: colors.text, fontSize: 17, fontWeight: '700', flexShrink: 1 },
  priorityBadge: {
    color: colors.background,
    backgroundColor: colors.gold,
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  worldDescription: { color: colors.mutedText, fontSize: 13, marginTop: 2 },
  progressTrack: { height: 6, backgroundColor: colors.locked, borderRadius: 3, marginTop: spacing.small },
  progressFill: { height: 6, backgroundColor: colors.success, borderRadius: 3 },
  worldProgressText: { color: colors.mutedText, fontSize: 12, marginTop: 4 },
});
