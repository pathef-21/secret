import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { COLORS } from '../src/theme/colors';

function RootLayoutNav() {
  const { user, couple, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user) {
      // User not authenticated -> redirect to login
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else if (!couple) {
      // User has no couple space -> redirect to setup/join
      if (segments[1] !== 'couple-setup') {
        router.replace('/(auth)/couple-setup');
      }
    } else {
      // User is authenticated and has a couple -> redirect to main tabs if in auth screen
      if (inAuthGroup) {
        router.replace('/(tabs)');
      }
    }
  }, [user, couple, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryRose} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" backgroundColor={COLORS.deepBlack} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.deepBlack },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="letters"
          options={{
            headerShown: true,
            title: 'Lettres d’Amour ❤️',
            headerStyle: { backgroundColor: COLORS.deepBlack },
            headerTintColor: COLORS.primaryRose,
            headerTitleStyle: { fontWeight: '700' },
          }}
        />
        <Stack.Screen
          name="profile"
          options={{
            headerShown: true,
            title: 'Mon Profil & Espace',
            headerStyle: { backgroundColor: COLORS.deepBlack },
            headerTintColor: COLORS.primaryRose,
            headerTitleStyle: { fontWeight: '700' },
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.deepBlack,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

