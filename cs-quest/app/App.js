import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, StatusBar as NativeStatusBar, StyleSheet, Text, View } from 'react-native';

import { fetchPlayer, logOut, setPlayerToken } from './src/api';
import { PrimaryButton, TabBar } from './src/components';
import AuthScreen from './src/screens/AuthScreen';
import CommunityScreen from './src/screens/CommunityScreen';
import GoalScreen from './src/screens/GoalScreen';
import HomeScreen from './src/screens/HomeScreen';
import NotesScreen from './src/screens/NotesScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import QuizScreen from './src/screens/QuizScreen';
import ResultScreen from './src/screens/ResultScreen';
import WorldScreen from './src/screens/WorldScreen';
import { playSound, setUpSounds } from './src/sound';
import { clearSavedToken, loadOnboardingSeen, loadSavedToken, saveOnboardingSeen, saveToken } from './src/storage';
import { colors, spacing } from './src/theme';
import { downloadNewUpdate, restartIntoUpdate } from './src/updates';

const SCREENS = {
  Home: HomeScreen,
  Community: CommunityScreen,
  Profile: ProfileScreen,
  World: WorldScreen,
  Notes: NotesScreen,
  Quiz: QuizScreen,
  Result: ResultScreen,
};

// Screens reachable from the bottom tab bar.
const TAB_SCREENS = new Set(['Home', 'Community', 'Profile']);

export default function App() {
  // 'loading' → 'onboarding' → 'auth' → 'goal' (new accounts only) → 'playing'.
  // Players from before accounts existed go to 'claim' to add a username and password.
  const [appStage, setAppStage] = useState('loading');
  const [authMode, setAuthMode] = useState('signup');
  const [isUpdateReady, setIsUpdateReady] = useState(false);

  // Navigation is a stack (like the one from your data structures unit):
  // opening a screen pushes it, the back button pops it.
  const [screenStack, setScreenStack] = useState([{ name: 'Home', params: {} }]);

  useEffect(() => {
    setUpSounds();
    downloadNewUpdate().then(setIsUpdateReady);

    async function restoreSavedPlayer() {
      try {
        const savedToken = await loadSavedToken();
        if (!savedToken) {
          setAppStage((await loadOnboardingSeen()) ? 'auth' : 'onboarding');
          setAuthMode('login');
          return;
        }
        setPlayerToken(savedToken);
        const player = await fetchPlayer();
        setAppStage(player.hasAccount ? 'playing' : 'claim');
      } catch (error) {
        if (error.statusCode === 401) {
          // The saved token is no longer valid, so log in again.
          await clearSavedToken();
          setPlayerToken(null);
          setAuthMode('login');
          setAppStage('auth');
        } else {
          // Probably offline: go in anyway and let screens show a retry button.
          setAppStage('playing');
        }
      }
    }
    restoreSavedPlayer();
  }, []);

  const navigation = {
    push: useCallback((name, params = {}) => {
      setScreenStack((currentStack) => [...currentStack, { name, params }]);
    }, []),
    replace: useCallback((name, params = {}) => {
      setScreenStack((currentStack) => [...currentStack.slice(0, -1), { name, params }]);
    }, []),
    goBack: useCallback(() => {
      setScreenStack((currentStack) => (currentStack.length > 1 ? currentStack.slice(0, -1) : currentStack));
    }, []),
  };

  function switchTab(tabName) {
    playSound('tap');
    setScreenStack([{ name: tabName, params: {} }]);
  }

  useEffect(() => {
    const backSubscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (appStage !== 'playing') return false;
      if (screenStack.length > 1) {
        navigation.goBack();
        return true;
      }
      if (screenStack[0].name !== 'Home') {
        setScreenStack([{ name: 'Home', params: {} }]);
        return true;
      }
      return false; // let Android close the app
    });
    return () => backSubscription.remove();
  }, [appStage, screenStack, navigation.goBack]);

  async function handleAuthenticated({ token, player, isNewAccount }) {
    if (token) {
      setPlayerToken(token);
      await saveToken(token);
    }
    await saveOnboardingSeen();
    setScreenStack([{ name: 'Home', params: {} }]);
    setAppStage(isNewAccount ? 'goal' : player.hasAccount ? 'playing' : 'claim');
  }

  async function handleLogOut() {
    try {
      await logOut();
    } catch {
      // Even if the server can't be reached, forget the session on this phone.
    }
    await clearSavedToken();
    setPlayerToken(null);
    setAuthMode('login');
    setAppStage('auth');
  }

  let content;
  if (appStage === 'loading') {
    content = <ActivityIndicator size="large" color={colors.primary} style={styles.centered} />;
  } else if (appStage === 'onboarding') {
    content = (
      <OnboardingScreen
        onChooseAuth={(chosenMode) => {
          playSound('tap');
          setAuthMode(chosenMode);
          setAppStage('auth');
        }}
      />
    );
  } else if (appStage === 'auth' || appStage === 'claim') {
    const currentMode = appStage === 'claim' && authMode !== 'login' ? 'claim' : authMode;
    content = (
      <AuthScreen
        key={currentMode}
        mode={currentMode}
        onSwitchMode={(nextMode) => {
          setAuthMode(nextMode);
          if (appStage === 'claim') setAppStage('auth');
        }}
        onAuthenticated={handleAuthenticated}
      />
    );
  } else if (appStage === 'goal') {
    content = (
      <GoalScreen
        onPickWorld={(world) => {
          setScreenStack([
            { name: 'Home', params: {} },
            { name: 'World', params: { worldSlug: world.slug, worldTitle: world.title } },
          ]);
          setAppStage('playing');
        }}
        onSkip={() => setAppStage('playing')}
      />
    );
  } else {
    const topScreen = screenStack[screenStack.length - 1];
    const ScreenComponent = SCREENS[topScreen.name];
    const showTabBar = screenStack.length === 1 && TAB_SCREENS.has(topScreen.name);
    content = (
      <View style={styles.playingArea}>
        <View style={styles.screenArea}>
          {/* The key makes React build a fresh screen each time, so data reloads on return. */}
          <ScreenComponent
            key={`${topScreen.name}-${screenStack.length}-${JSON.stringify(topScreen.params)}`}
            navigation={navigation}
            params={topScreen.params}
            onLogOut={handleLogOut}
          />
        </View>
        {showTabBar ? <TabBar activeScreen={topScreen.name} onSelect={switchTab} /> : null}
      </View>
    );
  }

  return (
    <View style={styles.appContainer}>
      <StatusBar style="light" />
      {isUpdateReady ? (
        <View style={styles.updateBanner}>
          <Text style={styles.updateText}>✨ A new version of CS Quest is ready</Text>
          <View style={styles.updateButton}>
            <PrimaryButton label="Restart" variant="gold" onPress={restartIntoUpdate} />
          </View>
        </View>
      ) : null}
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: NativeStatusBar.currentHeight ?? 0,
    // Android draws the app behind the system navigation bar. 48 is the height of
    // the 3-button bar, so nothing important ends up hidden underneath it.
    paddingBottom: 48,
  },
  centered: { flex: 1 },
  playingArea: { flex: 1 },
  screenArea: { flex: 1 },
  updateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
    backgroundColor: '#2a2160',
    borderBottomColor: colors.gold,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
  },
  updateText: { color: colors.text, fontWeight: '800', flex: 1 },
  updateButton: { minWidth: 110 },
});
