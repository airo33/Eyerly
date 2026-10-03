import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  useRouter,
} from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { PurchasesProvider } from '@/hooks/use-purchases';
import { SettingsProvider, useSettings } from '@/hooks/use-settings';
import { StreakProvider } from '@/hooks/use-streak';

function OnboardingGuard() {
  const router = useRouter();
  const { settings, hydrated } = useSettings();

  useEffect(() => {
    if (hydrated && !settings.onboardingDone) {
      router.replace('/onboarding');
    }
  }, [hydrated, settings.onboardingDone, router]);

  return null;
}

export default function RootLayout() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const colors = Colors[scheme];

  return (
    <SafeAreaProvider>
      <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
        <SettingsProvider>
          <StreakProvider>
            <PurchasesProvider>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.background },
                }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                  name="onboarding"
                  options={{ gestureEnabled: false }}
                />
                <Stack.Screen name="exercise/[id]" />
                <Stack.Screen name="paywall" />
              </Stack>
              <OnboardingGuard />
              <StatusBar style="auto" />
            </PurchasesProvider>
          </StreakProvider>
        </SettingsProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
