// Short sound effects. Each sound gets one player that is reused, so playback starts instantly.
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

import { loadSoundEnabled, saveSoundEnabled } from './storage';

const SOUND_FILES = {
  tap: require('../assets/sounds/tap.wav'),
  correct: require('../assets/sounds/correct.wav'),
  wrong: require('../assets/sounds/wrong.wav'),
  complete: require('../assets/sounds/complete.wav'),
  fail: require('../assets/sounds/fail.wav'),
  rankup: require('../assets/sounds/rankup.wav'),
};

const soundPlayers = {};
let soundEnabled = true;

export async function setUpSounds() {
  try {
    soundEnabled = await loadSoundEnabled();
    // Mix with other audio, so music from another app keeps playing.
    await setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' });
    for (const [soundName, soundFile] of Object.entries(SOUND_FILES)) {
      soundPlayers[soundName] = createAudioPlayer(soundFile);
    }
  } catch {
    // Sound is a nice extra: if the device can't play it, the game still works.
  }
}

export function playSound(soundName) {
  const soundPlayer = soundPlayers[soundName];
  if (!soundEnabled || !soundPlayer) return;
  try {
    soundPlayer.seekTo(0);
    soundPlayer.play();
  } catch {
    // Ignore playback errors.
  }
}

export function isSoundEnabled() {
  return soundEnabled;
}

export function setSoundEnabled(isEnabled) {
  soundEnabled = isEnabled;
  saveSoundEnabled(isEnabled);
}
