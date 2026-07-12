import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ProfileProvider } from '@/lib/profile';
import { FavoritesProvider } from '@/lib/favorites';
import { colors } from '@/theme';

export default function RootLayout() {
  const app = (
    <SafeAreaProvider>
      <ProfileProvider>
        <FavoritesProvider>
        <StatusBar style="dark" backgroundColor={colors.ivory} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.ivory },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(tabs)" />
        </Stack>
        </FavoritesProvider>
      </ProfileProvider>
    </SafeAreaProvider>
  );

  // Sur le web (desktop), l'app s'affiche dans un cadre mobile centré.
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webBackdrop}>
        <View style={styles.webFrame}>{app}</View>
      </View>
    );
  }
  return app;
}

const styles = StyleSheet.create({
  webBackdrop: {
    flex: 1,
    backgroundColor: '#EFE9DF',
    alignItems: 'center',
  },
  webFrame: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    backgroundColor: colors.ivory,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
  },
});
