import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { fetchWorlds } from '../api';
import { LoadingView, PrimaryButton } from '../components';
import { playSound } from '../sound';
import { colors, spacing } from '../theme';
import { WORLD_ICONS } from './HomeScreen';

// Shown once after creating an account: pick the world to start in.
export default function GoalScreen({ onPickWorld, onSkip }) {
  const [worlds, setWorlds] = useState(null);

  useEffect(() => {
    fetchWorlds()
      .then(setWorlds)
      .catch(() => onSkip());
    // Load once when the screen opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!worlds) return <LoadingView />;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Choose your first quest</Text>
      <Text style={styles.subheading}>Start with the unit you need most. You can play every world later.</Text>
      <View style={styles.list}>
        {worlds.map((world) => (
          <Pressable
            key={world.slug}
            style={({ pressed }) => [styles.worldCard, pressed && styles.pressed]}
            onPress={() => {
              playSound('tap');
              onPickWorld(world);
            }}
          >
            <Text style={styles.worldIcon}>{WORLD_ICONS[world.slug] ?? '📘'}</Text>
            <View style={styles.worldText}>
              <Text style={styles.worldTitle}>{world.title}</Text>
              <Text style={styles.worldDescription} numberOfLines={2}>
                {world.description}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </View>
      <PrimaryButton label="Decide later" variant="ghost" onPress={onSkip} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.large, gap: spacing.small, paddingBottom: spacing.large * 2 },
  heading: { color: colors.text, fontSize: 28, fontWeight: '900', marginTop: spacing.large },
  subheading: { color: colors.mutedText, fontSize: 15 },
  list: { gap: spacing.small, marginVertical: spacing.medium },
  worldCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medium,
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 18,
    padding: spacing.medium,
  },
  pressed: { borderColor: colors.gold },
  worldIcon: { fontSize: 28 },
  worldText: { flex: 1 },
  worldTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  worldDescription: { color: colors.mutedText, fontSize: 13, marginTop: 2 },
  chevron: { color: colors.gold, fontSize: 28, fontWeight: '900' },
});
