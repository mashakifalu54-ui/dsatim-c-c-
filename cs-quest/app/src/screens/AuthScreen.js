import { useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { claimAccount, logIn, signUp } from '../api';
import { PrimaryButton } from '../components';
import { playSound } from '../sound';
import { colors, spacing } from '../theme';

const SCREEN_TEXT = {
  signup: { heading: 'Create your account', subheading: 'Pick a username. Other players see it on the leaderboard.', button: 'CREATE ACCOUNT' },
  login: { heading: 'Welcome back', subheading: 'Log in to continue your quest.', button: 'LOG IN' },
  claim: {
    heading: 'Save your progress',
    subheading: 'CS Quest now has accounts. Choose a username and password: you keep all your XP and stars.',
    button: 'SAVE MY ACCOUNT',
  },
};

// mode: 'signup' | 'login' | 'claim'. onAuthenticated({ token, player, isNewAccount }).
export default function AuthScreen({ mode, onSwitchMode, onAuthenticated }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const screenText = SCREEN_TEXT[mode];
  const usernameLooksValid = /^[A-Za-z0-9_]{3,20}$/.test(username.trim());
  const canSubmit = usernameLooksValid && password.length >= 6 && !isSubmitting;

  async function handleSubmit() {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const trimmedName = username.trim();
      if (mode === 'claim') {
        const player = await claimAccount(trimmedName, password);
        onAuthenticated({ token: null, player, isNewAccount: false });
      } else {
        const response = mode === 'signup' ? await signUp(trimmedName, password) : await logIn(trimmedName, password);
        onAuthenticated({ token: response.token, player: response.player, isNewAccount: mode === 'signup' });
      }
      playSound('correct');
    } catch (error) {
      playSound('wrong');
      setErrorMessage(error.message);
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>⚡</Text>
        <Text style={styles.heading}>{screenText.heading}</Text>
        <Text style={styles.subheading}>{screenText.subheading}</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. timothy_codes"
            placeholderTextColor={colors.mutedText}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={20}
          />
          {mode !== 'login' ? (
            <Text style={styles.helper}>3–20 letters, numbers or underscores</Text>
          ) : null}

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="At least 6 characters"
              placeholderTextColor={colors.mutedText}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!isPasswordVisible}
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={() => {
                if (canSubmit) handleSubmit();
              }}
            />
            <Pressable style={styles.showButton} onPress={() => setIsPasswordVisible(!isPasswordVisible)} hitSlop={8}>
              <Text style={styles.showText}>{isPasswordVisible ? 'Hide' : 'Show'}</Text>
            </Pressable>
          </View>
          {mode !== 'login' ? (
            <Text style={styles.helper}>There is no password reset yet, so pick one you will remember.</Text>
          ) : null}

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <PrimaryButton
            label={isSubmitting ? 'Please wait…' : screenText.button}
            variant="gold"
            onPress={handleSubmit}
            disabled={!canSubmit}
          />
        </View>

        {mode === 'signup' ? (
          <Pressable onPress={() => onSwitchMode('login')} style={styles.switchLink}>
            <Text style={styles.switchText}>
              Already have an account? <Text style={styles.switchTextStrong}>Log in</Text>
            </Text>
          </Pressable>
        ) : null}
        {mode === 'login' ? (
          <Pressable onPress={() => onSwitchMode('signup')} style={styles.switchLink}>
            <Text style={styles.switchText}>
              New here? <Text style={styles.switchTextStrong}>Create an account</Text>
            </Text>
          </Pressable>
        ) : null}
        {mode === 'claim' ? (
          <Pressable onPress={() => onSwitchMode('login')} style={styles.switchLink}>
            <Text style={styles.switchText}>
              Have another account? <Text style={styles.switchTextStrong}>Log in instead</Text>
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.large, gap: spacing.small },
  logo: { fontSize: 48, textAlign: 'center' },
  heading: { color: colors.text, fontSize: 28, fontWeight: '900', textAlign: 'center' },
  subheading: { color: colors.mutedText, fontSize: 15, textAlign: 'center', lineHeight: 21 },
  form: { marginTop: spacing.large, gap: spacing.small },
  label: { color: colors.text, fontSize: 14, fontWeight: '800', marginTop: spacing.small },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing.medium,
    color: colors.text,
    fontSize: 17,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1, paddingRight: 64 },
  showButton: { position: 'absolute', right: 14 },
  showText: { color: colors.gold, fontWeight: '800' },
  helper: { color: colors.mutedText, fontSize: 12 },
  errorText: { color: colors.danger, textAlign: 'center', fontWeight: '700', marginVertical: spacing.small },
  switchLink: { marginTop: spacing.large, alignItems: 'center' },
  switchText: { color: colors.mutedText, fontSize: 15 },
  switchTextStrong: { color: colors.gold, fontWeight: '900' },
});
