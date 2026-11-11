import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { fetchCommunityFeed, fetchLeaderboard } from '../api';
import { CommentCard } from '../CommentsSection';
import { ErrorView, LoadingView, RankBadge } from '../components';
import { playSound } from '../sound';
import { colors, spacing } from '../theme';

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function CommunityScreen() {
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [leaderboardEntries, setLeaderboardEntries] = useState([]);
  const [feedComments, setFeedComments] = useState([]);
  const [loadState, setLoadState] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const loadCommunity = useCallback(async () => {
    setLoadState('loading');
    try {
      const [loadedEntries, loadedComments] = await Promise.all([fetchLeaderboard(), fetchCommunityFeed()]);
      setLeaderboardEntries(loadedEntries);
      setFeedComments(loadedComments);
      setLoadState('ready');
    } catch (error) {
      setErrorMessage(error.message);
      setLoadState('error');
    }
  }, []);

  useEffect(() => {
    loadCommunity();
  }, [loadCommunity]);

  function switchTab(tabName) {
    playSound('tap');
    setActiveTab(tabName);
  }

  let body;
  if (loadState === 'loading') body = <LoadingView />;
  else if (loadState === 'error') body = <ErrorView message={errorMessage} onRetry={loadCommunity} />;
  else if (activeTab === 'leaderboard') {
    body = (
      <ScrollView contentContainerStyle={styles.listContent}>
        <Text style={styles.hint}>Ranked by levels cleared, then stars, then XP.</Text>
        {leaderboardEntries.map((entry) => (
          <View key={entry.username} style={[styles.boardRow, entry.isMe && styles.boardRowMe]}>
            <Text style={styles.position}>{MEDALS[entry.position] ?? `#${entry.position}`}</Text>
            <View style={styles.boardInfo}>
              <Text style={styles.boardName}>
                {entry.username}
                {entry.isMe ? ' (you)' : ''}
              </Text>
              <RankBadge rank={entry.rank} compact />
            </View>
            <View style={styles.boardStats}>
              <Text style={styles.boardLevels}>{entry.levelsCompleted} lvls</Text>
              <Text style={styles.boardStars}>⭐ {entry.totalStars}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    );
  } else {
    body = (
      <ScrollView contentContainerStyle={styles.listContent}>
        <Text style={styles.hint}>Latest comments from levels you have played. Finish a level to join its discussion.</Text>
        {feedComments.length === 0 ? <Text style={styles.empty}>No discussions yet. Finish a level and post the first tip!</Text> : null}
        {feedComments.map((comment) => (
          <CommentCard key={comment.commentId} comment={comment} showLevel />
        ))}
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Community</Text>
      <View style={styles.segment}>
        {[
          { key: 'leaderboard', label: '🏆 Leaderboard' },
          { key: 'discussions', label: '💬 Discussions' },
        ].map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.segmentButton, activeTab === tab.key && styles.segmentActive]}
            onPress={() => switchTab(tab.key)}
          >
            <Text style={[styles.segmentLabel, activeTab === tab.key && styles.segmentLabelActive]}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { color: colors.text, fontSize: 26, fontWeight: '900', paddingHorizontal: spacing.medium, paddingTop: spacing.medium },
  segment: {
    flexDirection: 'row',
    margin: spacing.medium,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 4,
    borderColor: colors.cardBorder,
    borderWidth: 1,
  },
  segmentButton: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  segmentActive: { backgroundColor: colors.primary },
  segmentLabel: { color: colors.mutedText, fontWeight: '800' },
  segmentLabelActive: { color: colors.text },
  listContent: { paddingHorizontal: spacing.medium, paddingBottom: spacing.large * 2, gap: spacing.small },
  hint: { color: colors.mutedText, fontSize: 13, marginBottom: 4 },
  empty: { color: colors.mutedText, textAlign: 'center', marginTop: spacing.large },
  boardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medium,
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },
  boardRowMe: { borderColor: colors.gold, borderWidth: 2 },
  position: { color: colors.text, fontSize: 18, fontWeight: '900', width: 40, textAlign: 'center' },
  boardInfo: { flex: 1, gap: 4 },
  boardName: { color: colors.text, fontSize: 15, fontWeight: '800' },
  boardStats: { alignItems: 'flex-end' },
  boardLevels: { color: colors.gold, fontWeight: '900' },
  boardStars: { color: colors.mutedText, fontSize: 12, marginTop: 2 },
});
