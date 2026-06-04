import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { getRepositories } from '@/data/repositories';
import { ensureSeededDefaults, hasAnyMarkets, seedDemoData } from '@/data/seed';
import { colors } from '@/ui/theme';

const queryClient = new QueryClient();

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      // Seed reference data, and demo markets on the very first launch so the
      // dashboard and forecast are populated when the owner opens the app.
      await ensureSeededDefaults();
      if (!(await hasAnyMarkets())) {
        await seedDemoData(getRepositories());
      }
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerTintColor: colors.primaryDark }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="market/new" options={{ title: 'Add Market', presentation: 'modal' }} />
          <Stack.Screen name="market/[id]/index" options={{ title: 'Market' }} />
          <Stack.Screen name="market/[id]/edit" options={{ title: 'Edit Market', presentation: 'modal' }} />
        </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
