import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BudgetSlider } from '@/components/BudgetSlider';
import { LogoMark } from '@/components/Logo';
import { MorphologyPicker } from '@/components/MorphologyPicker';
import type { Morphology } from '@/lib/morphology';
import { useProfile } from '@/lib/profile';
import { colors, radius, serif } from '@/theme';

export default function Onboarding() {
  const router = useRouter();
  const { saveProfile } = useProfile();
  const [step, setStep] = useState<1 | 2>(1);
  const [morphology, setMorphology] = useState<Morphology | null>(null);
  const [budget, setBudget] = useState(30);
  const [saving, setSaving] = useState(false);

  const next = async () => {
    if (step === 1) {
      if (morphology) setStep(2);
      return;
    }
    if (!morphology || saving) return;
    setSaving(true);
    try {
      await saveProfile({ morphology, budget });
      router.replace('/(tabs)/shop');
    } finally {
      setSaving(false);
    }
  };

  const canContinue = step === 1 ? morphology !== null : true;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <LogoMark size={64} />
          <Text style={styles.brandName}>
            outfit <Text style={styles.brandWith}>with</Text> Zahra
          </Text>
          <Text style={styles.slogan}>
            Tu es magnifique.{'\n'}Apprends juste à te mettre en valeur.
          </Text>
        </View>

        <View style={styles.dots}>
          <View style={[styles.dot, step === 1 && styles.dotActive]} />
          <View style={[styles.dot, step === 2 && styles.dotActive]} />
        </View>

        {step === 1 ? (
          <View style={styles.section}>
            <Text style={styles.title}>Quelle est ta silhouette ?</Text>
            <Text style={styles.subtitle}>
              Chaque forme est belle — on va juste apprendre à la sublimer.
            </Text>
            <MorphologyPicker value={morphology} onChange={setMorphology} />
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.title}>Ton budget par pièce ?</Text>
            <Text style={styles.subtitle}>
              On ne te montrera que des articles à ta portée. Zéro frustration.
            </Text>
            <View style={styles.budgetCard}>
              <BudgetSlider value={budget} onChange={setBudget} />
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step === 2 && (
          <Pressable onPress={() => setStep(1)} style={styles.backLink}>
            <Text style={styles.backLinkText}>← Silhouette</Text>
          </Pressable>
        )}
        <Pressable
          onPress={next}
          disabled={!canContinue || saving}
          style={({ pressed }) => [
            styles.cta,
            (!canContinue || saving) && styles.ctaDisabled,
            pressed && styles.ctaPressed,
          ]}
          accessibilityRole="button"
        >
          <Text style={styles.ctaText}>
            {step === 1 ? 'Continuer' : 'Découvrir mes looks ✨'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.ivory,
  },
  scroll: {
    paddingHorizontal: 22,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 10,
  },
  brandName: {
    fontFamily: serif,
    fontSize: 26,
    color: colors.ink,
    marginTop: 10,
  },
  brandWith: {
    fontStyle: 'italic',
    color: colors.accent,
  },
  slogan: {
    fontFamily: serif,
    fontStyle: 'italic',
    fontSize: 15,
    lineHeight: 22,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 10,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 18,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.accent,
    width: 22,
  },
  section: {
    gap: 6,
  },
  title: {
    fontFamily: serif,
    fontSize: 24,
    color: colors.ink,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13.5,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 19,
  },
  budgetCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  footer: {
    paddingHorizontal: 22,
    paddingBottom: 14,
    paddingTop: 8,
    gap: 10,
  },
  backLink: {
    alignSelf: 'center',
  },
  backLinkText: {
    color: colors.muted,
    fontSize: 14,
  },
  cta: {
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaDisabled: {
    opacity: 0.35,
  },
  ctaPressed: {
    backgroundColor: colors.accentDark,
  },
  ctaText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
