import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { NotesText, PrimaryButton, ScreenHeader } from '../components';
import { playSound } from '../sound';
import { colors, spacing } from '../theme';

// Read the notes for a level, then start its quiz.
export default function NotesScreen({ navigation, params }) {
  const { level, worldSlug, worldTitle } = params;

  return (
    <View style={styles.container}>
      <ScreenHeader title={worldTitle} onBack={navigation.goBack} rightLabel="📘 Notes" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.levelLabel}>{level.isBoss ? 'BOSS LEVEL' : `LEVEL ${level.levelOrder}`}</Text>
        <Text style={styles.levelTitle}>{level.title}</Text>
        {level.notes ? (
          <NotesText notes={level.notes} />
        ) : (
          <Text style={styles.noNotes}>No notes for this level yet. Jump straight in!</Text>
        )}
        <Text style={styles.meta}>
          {level.questionCount} questions · get 50% for a star
          {level.timeLimitSeconds ? ` · ${level.timeLimitSeconds / 60} min` : ''}
        </Text>
        <PrimaryButton
          label="START QUIZ"
          variant="gold"
          onPress={() => {
            playSound('tap');
            navigation.replace('Quiz', { level, worldSlug, worldTitle });
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.medium, gap: spacing.medium, paddingBottom: spacing.large * 2 },
  levelLabel: { color: colors.gold, fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },
  levelTitle: { color: colors.text, fontSize: 26, fontWeight: '900', marginTop: -8 },
  noNotes: { color: colors.mutedText, fontSize: 15 },
  meta: { color: colors.mutedText, fontSize: 13, textAlign: 'center' },
});
