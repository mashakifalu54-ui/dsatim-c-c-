import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, StatusBar as NativeStatusBar, StyleSheet, View } from 'react-native';

import { fetchPlayer, setPlayerToken } from './src/api';
import HomeScreen from './src/screens/HomeScreen';
import QuizScreen from './src/screens/QuizScreen';
import ResultScreen from './src/screens/ResultScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import WorldScreen from './src/screens/WorldScreen';
import { clearSavedToken, loadSavedToken } from './src/storage';
import { colors } from './src/theme';

const SCREENS = {
  Home: HomeScreen,
  World: WorldScreen,
  Quiz: QuizScreen,
  Result: ResultScreen,
};

export default function App() {
  // 'loading' while we check for a saved player, then 'welcome' or 'playing'.
  const [appStage, setAppStage] = useState('loading');

  // Navigation is a stack (like the one from your data structures unit):
  // opening a screen pushes it, the back button pops it.
  const [screenStack, setScreenStack] = useState([{ name: 'Home', params: {} }]);

  useEffect(() => {
    async function restoreSavedPlayer() {
      try {
        const savedToken = await loadSavedToken();
        if (!savedToken) return setAppStage('welcome');

        setPlayerToken(savedToken);
        await fetchPlayer();
        setAppStage('playing');
      } catch (error) {
        if (error.statusCode === 401) {
          // The saved token is no longer valid, so start fresh.
          await clearSavedToken();
          setPlayerToken(null);
          setAppStage('welcome');
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

  useEffect(() => {
    const backSubscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (appStage !== 'playing' || screenStack.length <= 1) return false; // let Android close the app
      navigation.goBack();
      return true;
    });
    return () => backSubscription.remove();
  }, [appStage, screenStack.length, navigation.goBack]);

  let content;
  if (appStage === 'loading') {
    content = <ActivityIndicator size="large" color={colors.primary} style={styles.centered} />;
  } else if (appStage === 'welcome') {
    content = <WelcomeScreen onPlayerCreated={() => setAppStage('playing')} />;
  } else {
    const topScreen = screenStack[screenStack.length - 1];
    const ScreenComponent = SCREENS[topScreen.name];
    // The key makes React build a fresh screen each time, so data reloads on return.
    content = (
      <ScreenComponent
        key={`${topScreen.name}-${screenStack.length}-${JSON.stringify(topScreen.params)}`}
        navigation={navigation}
        params={topScreen.params}
      />
    );
  }

  return (
    <View style={styles.appContainer}>
      <StatusBar style="light" />
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
});
