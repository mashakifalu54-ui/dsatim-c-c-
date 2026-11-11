import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { fetchPlayer } from '../api';
import { ErrorView, LoadingView, PrimaryButton, ProgressBar, RankBadge } from '../components';
import { progressToNextRank, RANK_LADDER } from '../ranks';
import { isSoundEnabled, playSound, setSoundEnabled } from '../sound';
import { colors, spacing } from '../theme';

export default function ProfileScreen({ onLogOut }) {
  const [player, setPlayer] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [soundOn, setSoundOn] = useState(isSoundEnabled());

  const loadPlayer = useCallback(async () => {
    setErrorMessage('');
    try {
      setPlayer(await fetchPlayer());
    } catch (error) {
      setErrorMessage(error.message);
    }
  }, []);

  useEffect(() => {
    loadPlayer();
  }, [loadPlayer]);

  if (errorMessage) return <ErrorView message={errorMessage} onRetry={loadPlayer} />;
  if (!player) return <LoadingView />;

  const { rank, levelsCompleted } = player;
  const playerInitial = (player.username || player.displayName || '?').charAt(0).toUpperCase();

  function toggleSound() {
    const nextValue = !soundOn;
    setSoundEnabled(nextValue);
    setSoundOn(nextValue);
    if (nextValue) playSound('correct');
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>{playerInitial}</Text>
        </View>
        <Text style={styles.username}>{player.username ?? player.displayName}</Text>
        <View style={styles.centeredBadge}>
          <RankBadge rank={rank} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Rank progress</Text>
        <ProgressBar ratio={progressToNextRank(levelsCompleted, rank)} color={colors.gold} height={12} />
        <Text style={styles.cardText}>
          {rank.next
            ? `${rank.next.minLevels - levelsCompleted} more level${rank.next.minLevels - levelsCompleted === 1 ? '' : 's'} to ${rank.next.icon} ${rank.next.title}`
            : 'Top rank reached. Legend!'}
        </Text>
      </View>

      <View style={styles.statsRow}>
        {[
          { label: 'XP', value: `⚡ ${player.totalXp}` },
          { label: 'levels', value: `🏁 ${levelsCompleted}` },
          { label: 'streak', value: `🔥 ${player.currentStreak}` },
          { label: 'best', value: `🏆 ${player.longestStreak}` },
        ].map((stat) => (
          <View key={stat.label} style={styles.statBox}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Rank ladder</Text>
        {RANK_LADDER.map((ladderRank) => {
          const isReached = levelsCompleted >= ladderRank.minLevels;
          const isCurrent = ladderRank.title === rank.title;
          return (
            <View key={ladderRank.title} style={[styles.ladderRow, isCurrent && styles.ladderCurrent]}>
              <Text style={[styles.ladderIcon, !isReached && styles.dimmed]}>{ladderRank.icon}</Text>
              <Text style={[styles.ladderTitle, !isReached && styles.dimmed]}>{ladderRank.title}</Text>
              <Text style={styles.ladderNeed}>{ladderRank.minLevels} levels</Text>
            </View>
          );
        })}
      </View>

      <Pressable style={styles.settingRow} onPress={toggleSound}>
        <Text style={styles.settingLabel}>🔊 Sound effects</Text>
        <View style={[styles.toggle, soundOn && styles.toggleOn]}>
          <View style={[styles.toggleKnob, soundOn && styles.toggleKnobOn]} />
        </View>
      </Pressable>

      <PrimaryButton label="Log out" variant="ghost" onPress={onLogOut} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.medium, gap: spacing.medium, paddingBottom: spacing.large * 2 },
  header: { alignItems: 'center', gap: spacing.small, marginTop: spacing.medium },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primary,
    borderColor: colors.gold,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { color: colors.text, fontSize: 38, fontWeight: '900' },
  username: { color: colors.text, fontSize: 24, fontWeight: '900' },
  centeredBadge: { alignItems: 'center' },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 18,
    padding: spacing.medium,
    gap: spacing.small,
  },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  cardText: { color: colors.mutedText, fontSize: 14 },
  statsRow: { flexDirection: 'row', gap: spacing.small },
  statBox: {
    flex: 1,
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statValue: { color: colors.text, fontSize: 16, fontWeight: '900' },
  statLabel: { color: colors.mutedText, fontSize: 11, marginTop: 2 },
  ladderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.small, padding: 6, borderRadius: 10 },
  ladderCurrent: { backgroundColor: '#2a2160' },
  ladderIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  ladderTitle: { color: colors.text, fontWeight: '800', flex: 1 },
  ladderNeed: { color: colors.mutedText, fontSize: 12 },
  dimmed: { opacity: 0.35 },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 18,
    padding: spacing.medium,
  },
  settingLabel: { color: colors.text, fontSize: 16, fontWeight: '800' },
  toggle: { width: 52, height: 30, borderRadius: 15, backgroundColor: colors.locked, padding: 3 },
  toggleOn: { backgroundColor: colors.success },
  toggleKnob: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.text },
  toggleKnobOn: { marginLeft: 22 },
});
