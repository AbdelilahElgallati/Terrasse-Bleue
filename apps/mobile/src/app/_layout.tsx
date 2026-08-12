import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import { useAuthStore } from '@/store/auth-store';

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } });

export default function RootLayout() {
  const bootstrap = useAuthStore((state) => state.bootstrap);
  useEffect(() => { void bootstrap(); }, [bootstrap]);
  return (
    <QueryClientProvider client={queryClient}><SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.warmIvory }, animation: 'fade' }} />
    </SafeAreaProvider></QueryClientProvider>
  );
}
