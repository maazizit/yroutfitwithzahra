import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { PulseView } from '@/components/anim';
import { LogoMark } from '@/components/Logo';
import { useProfile } from '@/lib/profile';
import { colors, serif } from '@/theme';

export default function Index() {
  const { profile, loading } = useProfile();

  if (loading) {
    return (
      <View style={styles.splash}>
        <PulseView minScale={0.96} maxScale={1.08} duration={700}>
          <LogoMark size={72} />
        </PulseView>
        <Text style={styles.splashText}>
          outfit <Text style={styles.splashWith}>with</Text> Zahra
        </Text>
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
  splashText: {
    fontFamily: serif,
    fontSize: 22,
    color: colors.ink,
    marginTop: 14,
  },
  splashWith: {
    fontStyle: 'italic',
    color: colors.accent,
  },
  spinner: {
    marginTop: 24,
  },
});
