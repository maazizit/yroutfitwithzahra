import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { LogoMark } from '@/components/Logo';
import { useProfile } from '@/lib/profile';
import { colors } from '@/theme';

export default function Index() {
  const { profile, loading } = useProfile();

  if (loading) {
    return (
      <View style={styles.splash}>
        <LogoMark size={72} />
        <ActivityIndicator color={colors.accent} style={styles.spinner} />
      </View>
    );
  }

  return <Redirect href={profile ? '/(tabs)/shop' : '/onboarding'} />;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.ivory,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginTop: 24,
  },
});
