import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FadeInView, PulseView, ScalePressable } from '@/components/anim';
import { BudgetSlider } from '@/components/BudgetSlider';
import { BrandLogo } from '@/components/Logo';
import { MorphologyPicker } from '@/components/MorphologyPicker';
import { StylePreferencesPicker } from '@/components/StylePreferencesPicker';
import type { Morphology } from '@/lib/morphology';
import { useProfile } from '@/lib/profile';
import { colors, radius, serif } from '@/theme';

export default function Onboarding() {
  const router = useRouter();
  const { saveProfile } = useProfile();
  const [step, setStep] = useState<1 | 2>(1);
  const [morphology, setMorphology] = useState<Morphology | null>(null);
  const [budget, setBudget] = useState(30);
  const [modestMode, setModestMode] = useState(false);
  const [clothingSizes, setClothingSizes] = useState<string[]>([]);
  const [favoriteColors, setFavoriteColors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const next = async () => {
    if (step === 1) {
      if (morphology) setStep(2);
      return;
    }
    if (!morphology || saving) return;
    setSaving(true);
    try {
      await saveProfile({ morphology, budget, modestMode, clothingSizes, favoriteColors });
      router.replace('/(tabs)/shop');
    } finally {
      setSaving(false);
    }
  };

  const canContinue = step === 1 ? morphology !== null : true;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <FadeInView delay={0} dy={10}>
          <View style={styles.header}>
            <PulseView minScale={1} maxScale={1.04} duration={1600}>
              <BrandLogo size={150} />
            </PulseView>
            <View style={styles.goldDivider} />
            <Text style={styles.slogan}>
              Tu es magnifique.{'\n'}Apprends juste à te mettre en valeur.
            </Text>
          </View>
        </FadeInView>

        <View style={styles.dots}>
          <View style={[styles.dot, step === 1 && styles.dotActive]} />
          <View style={[styles.dot, step === 2 && styles.dotActive]} />
        </View>

        {step === 1 ? (
          <View style={styles.section}>
            <FadeInView delay={60}>
              <Text style={styles.title}>Quelle est ta silhouette ?</Text>
              <Text style={styles.subtitle}>
                Chaque forme est belle — on va juste apprendre à la sublimer.
              </Text>
            </FadeInView>
            <MorphologyPicker value={morphology} onChange={setMorphology} animateEntrance />
          </View>
        ) : (
          <View style={styles.section}>
            <FadeInView delay={0}>
              <Text style={styles.title}>Ton budget par pièce ?</Text>
              <Text style={styles.subtitle}>
                On ne te montrera que des articles à ta portée. Zéro frustration.
              </Text>
            </FadeInView>
            <FadeInView delay={120}>
              <View style={styles.budgetCard}>
                <BudgetSlider value={budget} onChange={setBudget} />
              </View>
            </FadeInView>
            <FadeInView delay={180}>
              <Text style={styles.sizeTitle}>Tailles & couleurs</Text>
              <Text style={styles.sizeSubtitle}>
                Multi-sélection — curvy & plus-size inclus. Laisse vide pour tout explorer.
              </Text>
              <StylePreferencesPicker
                sizes={clothingSizes}
                colors={favoriteColors}
                onChangeSizes={setClothingSizes}
                onChangeColors={setFavoriteColors}
              />
            </FadeInView>
            <FadeInView delay={240}>
              <View style={styles.modestCard}>
                <Text style={styles.modestEmoji}>🧕</Text>
                <View style={styles.modestTextBlock}>
                  <Text style={styles.modestTitle}>Mode Pudeur</Text>
                  <Text style={styles.modestSubtitle}>
                    Uniquement des looks char3i : couvrants, amples et élégants — la pudeur avec
                    style.
                  </Text>
                </View>
                <Switch
                  value={modestMode}
                  onValueChange={setModestMode}
                  trackColor={{ false: colors.border, true: colors.sage }}
                  thumbColor={colors.white}
                  accessibilityLabel="Activer le Mode Pudeur"
                />
              </View>
            </FadeInView>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step === 2 && (
          <ScalePressable onPress={() => setStep(1)} style={styles.backLink}>
            <Text style={styles.backLinkText}>← Silhouette</Text>
          </ScalePressable>
        )}
        <ScalePressable
          onPress={next}
          disabled={!canContinue || saving}
          pressedScale={0.97}
          style={(!canContinue || saving) && styles.ctaDisabled}
          accessibilityRole="button"
        >
          <LinearGradient
            colors={[colors.ink, '#4A3B31']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cta}
          >
            <Text style={styles.ctaText}>
              {step === 1 ? 'Continuer' : 'Découvrir mes looks'}
            </Text>
            <Text style={styles.ctaSpark}>✨</Text>
          </LinearGradient>
        </ScalePressable>
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
  goldDivider: {
    width: 46,
    height: 2,
    backgroundColor: colors.gold,
    borderRadius: 1,
    marginTop: 12,
    marginBottom: 2,
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
    marginTop: 6,
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
  sizeTitle: {
    fontFamily: serif,
    fontSize: 17,
    color: colors.ink,
    textAlign: 'center',
    marginTop: 8,
  },
  sizeSubtitle: {
    fontSize: 12.5,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 17,
    paddingHorizontal: 8,
  },
  modestCard: {
    marginTop: 14,
    backgroundColor: colors.sageSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.sage,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modestEmoji: {
    fontSize: 26,
  },
  modestTextBlock: {
    flex: 1,
    gap: 3,
  },
  modestTitle: {
    fontFamily: serif,
    fontSize: 17,
    color: colors.ink,
  },
  modestSubtitle: {
    fontSize: 12.5,
    color: colors.muted,
    lineHeight: 17,
  },
  footer: {
    paddingHorizontal: 22,
    paddingBottom: 14,
    paddingTop: 8,
    gap: 10,
  },
  backLink: {
    alignSelf: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  backLinkText: {
    color: colors.muted,
    fontSize: 14,
  },
  cta: {
    borderRadius: radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  ctaDisabled: {
    opacity: 0.35,
  },
  ctaText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  ctaSpark: {
    fontSize: 15,
  },
});
