import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { fetchPlayer, fetchWorlds } from '../api';
import { ErrorView, LoadingView, ProgressBar, RankBadge } from '../components';
import { playSound } from '../sound';
import { colors, spacing } from '../theme';

export const WORLD_ICONS = { os: '🖥️', arch: '⚙️', web: '🌐', sql: '🗄️', dsa: '⛰️', net: '📡', maths: '📐' };

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
        onPress={() => {
          playSound('tap');
          navigation.push('World', { worldSlug: world.slug, worldTitle: world.title });
        }}
      >
        <View style={styles.worldIconCircle}>
          <Text style={styles.worldIcon}>{WORLD_ICONS[world.slug] ?? '📘'}</Text>
        </View>
        <View style={styles.worldInfo}>
          <View style={styles.worldTitleRow}>
            <Text style={styles.worldTitle} numberOfLines={1}>
              {world.title}
            </Text>
            {world.isNovemberPriority ? <Text style={styles.priorityBadge}>NOV</Text> : null}
          </View>
          <ProgressBar ratio={progressRatio} />
          <Text style={styles.worldProgressText}>
            {world.completedLevels}/{world.levelCount} levels · ⭐ {world.totalStars}
          </Text>
        </View>
        <Text style={styles.worldPercent}>{Math.round(progressRatio * 100)}%</Text>
      </Pressable>
    );
  }

  const playerInitial = (player.username || player.displayName || '?').trim().charAt(0).toUpperCase();

  return (
    <FlatList
      data={worlds}
      keyExtractor={(world) => world.slug}
      renderItem={renderWorldCard}
      contentContainerStyle={styles.listContent}
      refreshControl={<RefreshControl refreshing={false} onRefresh={loadHomeData} tintColor={colors.primary} />}
      ListHeaderComponent={
        <View>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>{playerInitial}</Text>
            </View>
            <View style={styles.profileText}>
              <Text style={styles.greeting} numberOfLines={1}>
                Hey, {player.username ?? player.displayName}!
              </Text>
              <RankBadge rank={player.rank} />
            </View>
          </View>
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
          <View style={styles.newBanner}>
            <Text style={styles.newBannerTag}>NEW</Text>
            <Text style={styles.newBannerText}>C# levels are now in Data Structure Peaks</Text>
          </View>
          <Text style={styles.sectionTitle}>Your Worlds</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: { padding: spacing.medium, gap: spacing.small, paddingBottom: spacing.large * 2 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.medium },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    borderColor: colors.gold,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { color: colors.text, fontSize: 26, fontWeight: '900' },
  profileText: { flex: 1 },
  greeting: { color: colors.text, fontSize: 24, fontWeight: '900', marginBottom: 4 },
  tagline: { color: colors.gold, fontSize: 13, fontWeight: '700', letterSpacing: 1, marginTop: 2 },
  newBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
    backgroundColor: '#2a2160',
    borderColor: colors.gold,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: spacing.small,
    paddingHorizontal: spacing.medium,
    marginTop: spacing.medium,
  },
  newBannerTag: { color: colors.background, backgroundColor: colors.gold, fontWeight: '900', fontSize: 12, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, overflow: 'hidden' },
  newBannerText: { flex: 1, color: colors.text, fontWeight: '700', fontSize: 14 },
  statsRow: { flexDirection: 'row', gap: spacing.small, marginTop: spacing.medium },
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
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '800', marginTop: spacing.large, marginBottom: spacing.small },
  worldCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medium,
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 20,
    padding: spacing.medium,
  },
  worldCardPressed: { opacity: 0.7 },
  worldIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.background,
    borderColor: colors.primary,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  worldIcon: { fontSize: 26 },
  worldInfo: { flex: 1, gap: 6 },
  worldTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.small },
  worldTitle: { color: colors.text, fontSize: 16, fontWeight: '800', flexShrink: 1 },
  priorityBadge: {
    color: colors.background,
    backgroundColor: colors.gold,
    fontSize: 10,
    fontWeight: '900',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  worldProgressText: { color: colors.mutedText, fontSize: 12 },
  worldPercent: { color: colors.gold, fontSize: 16, fontWeight: '900' },
});
