import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '../components';
import { playSound } from '../sound';
import { colors, spacing } from '../theme';

const FEATURES = [
  { icon: '📘', title: 'Learn', text: 'Short notes for every level, from Linux to calculus.' },
  { icon: '🎮', title: 'Play', text: 'Quizzes, XP, stars and daily streaks.' },
  { icon: '🏆', title: 'Rank up', text: 'Clear levels to climb from Rookie to Grandmaster.' },
];

export default function OnboardingScreen({ onChooseAuth }) {
  const [stepNumber, setStepNumber] = useState(0);

  if (stepNumber === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.centerBlock}>
          <Image source={require('../../assets/icon.png')} style={styles.logo} />
          <Text style={styles.title}>CS Quest</Text>
          <Text style={styles.tagline}>STUDY. PLAY. BECOME A CS HERO.</Text>
          <Text style={styles.subtitle}>Your journey to master computer science starts here.</Text>
        </View>
        <View style={styles.dots}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
        </View>
        <PrimaryButton
          label="GET STARTED"
          variant="gold"
          onPress={() => {
            playSound('tap');
            setStepNumber(1);
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.centerBlock}>
        <Text style={styles.heading}>Welcome to CS Quest</Text>
        <Text style={styles.subtitle}>Gamified. Focused. Built for future coders.</Text>
        <View style={styles.featureList}>
          {FEATURES.map((feature) => (
            <View key={feature.title} style={styles.featureRow}>
              <View style={styles.featureIconCircle}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.text}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.dots}>
        <View style={styles.dot} />
        <View style={[styles.dot, styles.dotActive]} />
      </View>
      <View style={styles.buttons}>
        <PrimaryButton label="CREATE ACCOUNT" variant="gold" onPress={() => onChooseAuth('signup')} />
        <PrimaryButton label="I already have an account" variant="ghost" onPress={() => onChooseAuth('login')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.large, justifyContent: 'space-between' },
  centerBlock: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.small },
  logo: { width: 140, height: 140, borderRadius: 32, marginBottom: spacing.medium },
  title: { color: colors.text, fontSize: 40, fontWeight: '900' },
  tagline: { color: colors.gold, fontSize: 13, fontWeight: '900', letterSpacing: 2 },
  heading: { color: colors.text, fontSize: 28, fontWeight: '900', textAlign: 'center' },
  subtitle: { color: colors.mutedText, fontSize: 15, textAlign: 'center', marginTop: 4 },
  featureList: { alignSelf: 'stretch', gap: spacing.medium, marginTop: spacing.large },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medium,
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 18,
    padding: spacing.medium,
  },
  featureIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    borderColor: colors.primary,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIcon: { fontSize: 24 },
  featureText: { flex: 1 },
  featureTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  featureDescription: { color: colors.mutedText, fontSize: 13, marginTop: 2 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: spacing.medium },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.locked },
  dotActive: { width: 24, backgroundColor: colors.gold },
  buttons: { gap: spacing.small },
});
