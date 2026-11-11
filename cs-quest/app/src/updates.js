// In-app updates (EAS Update): new screens and fixes arrive without a new APK.
// On launch, check for a newer update; if one downloads, the app offers a restart.
import * as Updates from 'expo-updates';

export async function downloadNewUpdate() {
  // Updates only work in a real build, not while developing with Expo Go.
  if (__DEV__ || !Updates.isEnabled) return false;
  try {
    const updateCheck = await Updates.checkForUpdateAsync();
    if (!updateCheck.isAvailable) return false;
    await Updates.fetchUpdateAsync();
    return true;
  } catch {
    // Offline or the update server is unreachable: just keep the current version.
    return false;
  }
}

export function restartIntoUpdate() {
  return Updates.reloadAsync();
}
