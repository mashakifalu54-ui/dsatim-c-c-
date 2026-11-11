// Discussion under a level: read what others said, post a tip, delete or report.
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { deleteComment, fetchComments, postComment, reportComment } from './api';
import { PrimaryButton, RankBadge } from './components';
import { colors, spacing } from './theme';

const MAX_COMMENT_LENGTH = 300;

export function timeAgo(isoTime) {
  const secondsAgo = Math.max(0, (Date.now() - new Date(isoTime).getTime()) / 1000);
  if (!Number.isFinite(secondsAgo)) return '';
  if (secondsAgo < 60) return 'just now';
  if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`;
  if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`;
  return `${Math.floor(secondsAgo / 86400)}d ago`;
}

export function CommentCard({ comment, onDelete, onReport, showLevel = false }) {
  return (
    <View style={styles.commentCard}>
      <View style={styles.commentHeader}>
        <Text style={styles.commentAuthor}>{comment.username}</Text>
        <RankBadge rank={comment.rank} compact />
        <Text style={styles.commentTime}>{timeAgo(comment.createdAt)}</Text>
      </View>
      {showLevel && comment.levelTitle ? (
        <Text style={styles.commentLevel}>
          {comment.worldTitle} · {comment.levelTitle}
        </Text>
      ) : null}
      <Text style={styles.commentBody}>{comment.body}</Text>
      {onDelete || onReport ? (
        <View style={styles.commentActions}>
          {comment.isMine && onDelete ? (
            <Pressable onPress={() => onDelete(comment)} hitSlop={8}>
              <Text style={styles.commentAction}>Delete</Text>
            </Pressable>
          ) : null}
          {!comment.isMine && onReport ? (
            <Pressable onPress={() => onReport(comment)} hitSlop={8}>
              <Text style={styles.commentAction}>Report</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export default function CommentsSection({ levelId }) {
  const [comments, setComments] = useState([]);
  const [loadState, setLoadState] = useState('loading');
  const [draftText, setDraftText] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const loadComments = useCallback(async () => {
    try {
      setComments(await fetchComments(levelId));
      setLoadState('ready');
    } catch (error) {
      setStatusMessage(error.message);
      setLoadState('error');
    }
  }, [levelId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  async function handlePost() {
    setIsPosting(true);
    setStatusMessage('');
    try {
      setComments(await postComment(levelId, draftText.trim()));
      setDraftText('');
    } catch (error) {
      setStatusMessage(error.message);
    }
    setIsPosting(false);
  }

  async function handleDelete(comment) {
    try {
      await deleteComment(comment.commentId);
      setComments((currentComments) => currentComments.filter((existing) => existing.commentId !== comment.commentId));
    } catch (error) {
      setStatusMessage(error.message);
    }
  }

  async function handleReport(comment) {
    try {
      await reportComment(comment.commentId);
      setStatusMessage('Thanks — the comment was reported.');
    } catch (error) {
      setStatusMessage(error.message);
    }
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>💬 Discussion</Text>
      <Text style={styles.sectionHint}>Share a tip or ask about this level. Be kind, no answer dumps.</Text>
      <TextInput
        style={styles.input}
        placeholder="Write a comment…"
        placeholderTextColor={colors.mutedText}
        value={draftText}
        onChangeText={setDraftText}
        maxLength={MAX_COMMENT_LENGTH}
        multiline
      />
      <View style={styles.postRow}>
        <Text style={styles.counter}>
          {draftText.length}/{MAX_COMMENT_LENGTH}
        </Text>
        <View style={styles.postButton}>
          <PrimaryButton
            label={isPosting ? 'Posting…' : 'Post'}
            onPress={handlePost}
            disabled={isPosting || draftText.trim().length === 0}
          />
        </View>
      </View>
      {statusMessage ? <Text style={styles.statusText}>{statusMessage}</Text> : null}
      {loadState === 'ready' && comments.length === 0 ? (
        <Text style={styles.emptyText}>No comments yet. Be the first!</Text>
      ) : null}
      {comments.map((comment) => (
        <CommentCard key={comment.commentId} comment={comment} onDelete={handleDelete} onReport={handleReport} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.small },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  sectionHint: { color: colors.mutedText, fontSize: 13 },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing.medium,
    color: colors.text,
    fontSize: 15,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  postRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  counter: { color: colors.mutedText, fontSize: 12 },
  postButton: { minWidth: 110 },
  statusText: { color: colors.gold, fontSize: 13 },
  emptyText: { color: colors.mutedText, fontSize: 14, textAlign: 'center', marginVertical: spacing.small },
  commentCard: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 6,
  },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  commentAuthor: { color: colors.text, fontWeight: '800', fontSize: 14 },
  commentTime: { color: colors.mutedText, fontSize: 12, marginLeft: 'auto' },
  commentLevel: { color: colors.gold, fontSize: 12, fontWeight: '700' },
  commentBody: { color: colors.text, fontSize: 15, lineHeight: 21 },
  commentActions: { flexDirection: 'row', gap: spacing.medium },
  commentAction: { color: colors.mutedText, fontSize: 12, fontWeight: '700' },
});
