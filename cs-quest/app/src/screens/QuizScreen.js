import { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { completeLevel, fetchQuestions, revealAnswer, submitAnswer } from '../api';
import { ErrorView, LoadingView, PrimaryButton, ScreenHeader } from '../components';
import { colors, spacing } from '../theme';

export default function QuizScreen({ navigation, params }) {
  const { level, worldSlug, worldTitle } = params;

  const [questions, setQuestions] = useState([]);
  const [loadState, setLoadState] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [revealedAnswer, setRevealedAnswer] = useState(null); // only for "find the bug"
  const [feedback, setFeedback] = useState(null); // the server's verdict on the current question
  const [isBusy, setIsBusy] = useState(false);

  const [correctCount, setCorrectCount] = useState(0);
  const [xpEarnedThisRun, setXpEarnedThisRun] = useState(0);

  const loadQuestions = useCallback(async () => {
    setLoadState('loading');
    try {
      setQuestions(await fetchQuestions(level.levelId));
      setLoadState('ready');
    } catch (error) {
      setErrorMessage(error.message);
      setLoadState('error');
    }
  }, [level.levelId]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // Runs a network action with the buttons disabled, and shows any error inline.
  async function runBusyAction(action) {
    setIsBusy(true);
    setErrorMessage('');
    try {
      await action();
    } catch (error) {
      setErrorMessage(error.message);
    }
    setIsBusy(false);
  }

  const currentQuestion = questions[questionIndex];
  const isLastQuestion = questionIndex === questions.length - 1;

  function recordVerdict(verdict) {
    setFeedback(verdict);
    if (verdict.isCorrect) setCorrectCount((previousCount) => previousCount + 1);
    setXpEarnedThisRun((previousXp) => previousXp + verdict.xpEarned);
  }

  function handleCheckAnswer() {
    const givenAnswer = currentQuestion.questionType === 'multiple_choice' ? selectedOption : typedAnswer;
    runBusyAction(async () => {
      recordVerdict(await submitAnswer({ questionId: currentQuestion.questionId, givenAnswer }));
    });
  }

  function handleRevealAnswer() {
    runBusyAction(async () => {
      setRevealedAnswer(await revealAnswer(currentQuestion.questionId));
    });
  }

  function handleSelfGrade(selfGradedCorrect) {
    runBusyAction(async () => {
      recordVerdict(
        await submitAnswer({ questionId: currentQuestion.questionId, givenAnswer: typedAnswer, selfGradedCorrect }),
      );
    });
  }

  function handleNext() {
    if (!isLastQuestion) {
      setQuestionIndex(questionIndex + 1);
      setSelectedOption(null);
      setTypedAnswer('');
      setRevealedAnswer(null);
      setFeedback(null);
      return;
    }
    runBusyAction(async () => {
      const levelResult = await completeLevel(level.levelId, correctCount);
      navigation.replace('Result', { level, worldSlug, worldTitle, levelResult, xpEarned: xpEarnedThisRun });
    });
  }

  if (loadState === 'loading') return <LoadingView />;
  if (loadState === 'error') return <ErrorView message={errorMessage} onRetry={loadQuestions} />;
  if (questions.length === 0) {
    return <ErrorView message="This level has no questions yet." onRetry={navigation.goBack} />;
  }

  function renderAnswerArea() {
    if (currentQuestion.questionType === 'multiple_choice') {
      return currentQuestion.options.map((optionText) => {
        const isSelected = selectedOption === optionText;
        const isTheCorrectOne = feedback && optionText === feedback.correctAnswer;
        const isWrongPick = feedback && isSelected && !feedback.isCorrect;
        return (
          <Pressable
            key={optionText}
            disabled={feedback !== null}
            onPress={() => setSelectedOption(optionText)}
            style={[
              styles.optionButton,
              isSelected && styles.optionSelected,
              isTheCorrectOne && styles.optionCorrect,
              isWrongPick && styles.optionWrong,
            ]}
          >
            <Text style={styles.optionText}>{optionText}</Text>
          </Pressable>
        );
      });
    }

    const isFindBug = currentQuestion.questionType === 'find_bug';
    return (
      <TextInput
        style={[styles.answerInput, isFindBug && styles.answerInputTall]}
        placeholder={isFindBug ? 'Describe the bug in your own words…' : 'Type your answer'}
        placeholderTextColor={colors.mutedText}
        value={typedAnswer}
        onChangeText={setTypedAnswer}
        editable={feedback === null && revealedAnswer === null}
        autoCapitalize="none"
        autoCorrect={false}
        multiline={isFindBug}
        returnKeyType={isFindBug ? 'default' : 'done'}
        // Pressing "done" on the keyboard checks a typed answer straight away.
        onSubmitEditing={() => {
          if (!isFindBug && !isBusy && typedAnswer.trim().length > 0) handleCheckAnswer();
        }}
      />
    );
  }

  function renderActionArea() {
    if (feedback) {
      return (
        <View style={[styles.feedbackPanel, feedback.isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
          <Text style={styles.feedbackTitle}>
            {feedback.isCorrect ? `Correct!  +${feedback.xpEarned} XP` : 'Not quite'}
          </Text>
          {!feedback.isCorrect ? <Text style={styles.feedbackText}>Answer: {feedback.correctAnswer}</Text> : null}
          {feedback.explanation ? <Text style={styles.feedbackText}>{feedback.explanation}</Text> : null}
          <PrimaryButton label={isLastQuestion ? 'Finish level' : 'Next'} onPress={handleNext} disabled={isBusy} />
        </View>
      );
    }

    if (currentQuestion.questionType === 'find_bug') {
      if (!revealedAnswer) {
        return <PrimaryButton label="Show answer" onPress={handleRevealAnswer} disabled={isBusy} />;
      }
      return (
        <View style={styles.selfGradePanel}>
          <Text style={styles.feedbackTitle}>Model answer</Text>
          <Text style={styles.feedbackText}>{revealedAnswer.correctAnswer}</Text>
          <Text style={styles.feedbackText}>Be honest — did you spot it?</Text>
          <View style={styles.selfGradeButtons}>
            <View style={styles.selfGradeButton}>
              <PrimaryButton label="I missed it" variant="danger" onPress={() => handleSelfGrade(false)} disabled={isBusy} />
            </View>
            <View style={styles.selfGradeButton}>
              <PrimaryButton label="I got it" variant="success" onPress={() => handleSelfGrade(true)} disabled={isBusy} />
            </View>
          </View>
        </View>
      );
    }

    const hasAnswer =
      currentQuestion.questionType === 'multiple_choice' ? selectedOption !== null : typedAnswer.trim().length > 0;
    return <PrimaryButton label="Check" onPress={handleCheckAnswer} disabled={isBusy || !hasAnswer} />;
  }

  return (
    // KeyboardAvoidingView shrinks the screen when the keyboard opens,
    // so the Check button stays visible while typing an answer.
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <ScreenHeader title={level.title} onBack={navigation.goBack} />
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${((questionIndex + (feedback ? 1 : 0)) / questions.length) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.questionContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.questionCounter}>
          Question {questionIndex + 1} of {questions.length} · {currentQuestion.xpReward} XP
        </Text>
        <Text style={styles.prompt}>{currentQuestion.prompt}</Text>
        {currentQuestion.codeSnippet ? (
          <ScrollView horizontal style={styles.codeBlock}>
            <Text style={styles.codeText}>{currentQuestion.codeSnippet}</Text>
          </ScrollView>
        ) : null}
        <View style={styles.answerArea}>{renderAnswerArea()}</View>
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        {renderActionArea()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progressTrack: { height: 8, backgroundColor: colors.locked, marginHorizontal: spacing.medium, borderRadius: 4 },
  progressFill: { height: 8, backgroundColor: colors.success, borderRadius: 4 },
  questionContent: { padding: spacing.medium, gap: spacing.medium },
  questionCounter: { color: colors.mutedText, fontSize: 13 },
  prompt: { color: colors.text, fontSize: 20, fontWeight: '700', lineHeight: 28 },
  codeBlock: { backgroundColor: '#090b1a', borderRadius: 12, padding: spacing.medium },
  codeText: { color: '#c8ffd9', fontFamily: 'monospace', fontSize: 14, lineHeight: 20 },
  answerArea: { gap: spacing.small },
  optionButton: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 2,
    borderRadius: 14,
    padding: spacing.medium,
  },
  optionSelected: { borderColor: colors.primary },
  optionCorrect: { borderColor: colors.success, backgroundColor: '#17402f' },
  optionWrong: { borderColor: colors.danger, backgroundColor: '#4a1c26' },
  optionText: { color: colors.text, fontSize: 16 },
  answerInput: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 2,
    borderRadius: 14,
    padding: spacing.medium,
    color: colors.text,
    fontSize: 18,
    fontFamily: 'monospace',
  },
  answerInputTall: { minHeight: 90, textAlignVertical: 'top', fontSize: 15 },
  feedbackPanel: { borderRadius: 16, padding: spacing.medium, gap: spacing.small },
  feedbackCorrect: { backgroundColor: '#17402f' },
  feedbackWrong: { backgroundColor: '#4a1c26' },
  feedbackTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  feedbackText: { color: colors.text, fontSize: 15, lineHeight: 21 },
  selfGradePanel: { backgroundColor: colors.card, borderRadius: 16, padding: spacing.medium, gap: spacing.small },
  selfGradeButtons: { flexDirection: 'row', gap: spacing.small, marginTop: spacing.small },
  selfGradeButton: { flex: 1 },
  errorText: { color: colors.danger, textAlign: 'center' },
});
