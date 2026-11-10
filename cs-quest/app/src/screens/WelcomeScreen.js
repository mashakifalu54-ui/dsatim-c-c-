import { useState } from 'react';
import { KeyboardAvoidingView, StyleSheet, Text, TextInput, View } from 'react-native';

import { createPlayer, setPlayerToken } from '../api';
import { PrimaryButton } from '../components';
import { saveToken } from '../storage';
import { colors, spacing } from '../theme';

export default function WelcomeScreen({ onPlayerCreated }) {
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleStart() {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const { token } = await createPlayer(displayName.trim());
      await saveToken(token);
      setPlayerToken(token);
      onPlayerCreated();
    } catch (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <Text style={styles.logo}>🎮</Text>
      <Text style={styles.title}>CS Quest</Text>
      <Text style={styles.subtitle}>Level up your Computer Science, one question at a time.</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.nameInput}
          placeholder="Your player name"
          placeholderTextColor={colors.mutedText}
          value={displayName}
          onChangeText={setDisplayName}
          maxLength={30}
          autoCapitalize="words"
        />
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        <PrimaryButton
          label={isSubmitting ? 'Creating player…' : 'Start quest'}
          onPress={handleStart}
          disabled={isSubmitting || displayName.trim().length < 2}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: spacing.large },
  logo: { fontSize: 64, textAlign: 'center' },
  title: { color: colors.text, fontSize: 36, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: colors.mutedText, fontSize: 16, textAlign: 'center', marginTop: spacing.small },
  form: { marginTop: spacing.large * 2, gap: spacing.medium },
  nameInput: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing.medium,
    color: colors.text,
    fontSize: 18,
  },
  errorText: { color: colors.danger, textAlign: 'center' },
});
