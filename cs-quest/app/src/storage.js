// Saves the player's secret token on the phone (encrypted by Android).
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'csquest_player_token';

export function loadSavedToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export function saveToken(playerToken) {
  return SecureStore.setItemAsync(TOKEN_KEY, playerToken);
}

export function clearSavedToken() {
  return SecureStore.deleteItemAsync(TOKEN_KEY);
}
