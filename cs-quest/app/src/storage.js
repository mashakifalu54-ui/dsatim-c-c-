// Small values saved on the phone. SecureStore encrypts them with Android's keystore.
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'csquest_player_token';
const SOUND_KEY = 'csquest_sound_on';
const ONBOARDING_KEY = 'csquest_onboarding_seen';

export function loadSavedToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export function saveToken(playerToken) {
  return SecureStore.setItemAsync(TOKEN_KEY, playerToken);
}

export function clearSavedToken() {
  return SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function loadSoundEnabled() {
  return (await SecureStore.getItemAsync(SOUND_KEY)) !== 'off';
}

export function saveSoundEnabled(isEnabled) {
  return SecureStore.setItemAsync(SOUND_KEY, isEnabled ? 'on' : 'off');
}

export async function loadOnboardingSeen() {
  return (await SecureStore.getItemAsync(ONBOARDING_KEY)) === 'yes';
}

export function saveOnboardingSeen() {
  return SecureStore.setItemAsync(ONBOARDING_KEY, 'yes');
}
