import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BudgetSlider } from '@/components/BudgetSlider';
import { LogoHeader } from '@/components/Logo';
import { MorphologyPicker } from '@/components/MorphologyPicker';
import { tagGarment, type MorphoTagResult } from '@/lib/gemini';
import { morphologyInfo, morphologyLabel, type Morphology } from '@/lib/morphology';
import { useProfile } from '@/lib/profile';
import { colors, radius, serif } from '@/theme';

export default function ProfileScreen() {
  const { profile, saveProfile } = useProfile();
  const [morphology, setMorphology] = useState<Morphology | null>(profile?.morphology ?? null);
  const [budget, setBudget] = useState(profile?.budget ?? 30);
  const [saved, setSaved] = useState(false);

  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<MorphoTagResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const save = async () => {
    if (!morphology) return;
    await saveProfile({ morphology, budget });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const analyze = async () => {
    if (!aiInput.trim() || aiLoading) return;
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);
    try {
      const result = await tagGarment({ description: aiInput.trim() });
      setAiResult(result);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'Analyse indisponible pour le moment.');
    } finally {
      setAiLoading(false);
    }
  };

  const info = morphology ? morphologyInfo(morphology) : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LogoHeader subtitle="Mon style" />

        <Text style={styles.sectionTitle}>Ma silhouette</Text>
        <MorphologyPicker value={morphology} onChange={setMorphology} compact />

        {info && (
          <View style={styles.adviceCard}>
            <Text style={styles.adviceTitle}>Conseils pour ta silhouette {info.label}</Text>
            {info.advice.map((a) => (
              <Text key={a} style={styles.adviceItem}>
                •  {a}
              </Text>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>Mon budget</Text>
        <View style={styles.card}>
          <BudgetSlider value={budget} onChange={setBudget} />
        </View>

        <Pressable
          onPress={save}
          disabled={!morphology}
          style={({ pressed }) => [
            styles.saveButton,
            !morphology && styles.saveDisabled,
            pressed && styles.savePressed,
          ]}
        >
          <Text style={styles.saveText}>{saved ? 'Enregistré ✓' : 'Enregistrer'}</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Styliste IA ✨</Text>
        <View style={styles.card}>
          <Text style={styles.aiHint}>
            Décris un vêtement repéré en boutique ou en vente privée, et découvre à quelles
            silhouettes il va le mieux.
          </Text>
          <TextInput
            style={styles.aiInput}
            placeholder="Ex : robe portefeuille fluide à imprimé floral, manches courtes…"
            placeholderTextColor={colors.faint}
            value={aiInput}
            onChangeText={setAiInput}
            multiline
          />
          <Pressable
            onPress={analyze}
            disabled={!aiInput.trim() || aiLoading}
            style={({ pressed }) => [
              styles.aiButton,
              (!aiInput.trim() || aiLoading) && styles.saveDisabled,
              pressed && styles.savePressed,
            ]}
          >
            {aiLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.saveText}>Analyser avec l'IA</Text>
            )}
          </Pressable>

          {aiError && <Text style={styles.aiError}>{aiError}</Text>}

          {aiResult && (
            <View style={styles.aiResult}>
              <Text style={styles.aiResultTitle}>
                {aiResult.category} · confiance {(aiResult.confidence * 100).toFixed(0)} %
              </Text>
              <View style={styles.aiTags}>
                {aiResult.tags.length > 0 ? (
                  aiResult.tags.map((t) => (
                    <View
                      key={t}
                      style={[
                        styles.aiTag,
                        profile?.morphology === t && styles.aiTagMine,
                      ]}
                    >
                      <Text
                        style={[
                          styles.aiTagText,
                          profile?.morphology === t && styles.aiTagTextMine,
                        ]}
                      >
                        {morphologyLabel(t)}
                        {profile?.morphology === t ? '  ✓ toi' : ''}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.aiHint}>Aucune silhouette identifiée.</Text>
                )}
              </View>
            </View>
          )}
        </View>

        <Text style={styles.footerSlogan}>
          "You're gorgeous. Just learn how to embrace your shape."
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.ivory,
  },
  scroll: {
    padding: 18,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontFamily: serif,
    fontSize: 20,
    color: colors.ink,
    marginTop: 24,
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 10,
  },
  adviceCard: {
    marginTop: 14,
    backgroundColor: colors.sageSoft,
    borderRadius: radius.md,
    padding: 16,
    gap: 6,
  },
  adviceTitle: {
    fontFamily: serif,
    fontSize: 15,
    color: colors.ink,
    marginBottom: 2,
  },
  adviceItem: {
    fontSize: 13,
    color: colors.ink,
    lineHeight: 19,
  },
  saveButton: {
    marginTop: 16,
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveDisabled: {
    opacity: 0.4,
  },
  savePressed: {
    backgroundColor: colors.accentDark,
  },
  saveText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  aiHint: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
  },
  aiInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    minHeight: 72,
    padding: 12,
    fontSize: 14,
    color: colors.ink,
    textAlignVertical: 'top',
    backgroundColor: colors.ivory,
  },
  aiButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 12,
    alignItems: 'center',
  },
  aiError: {
    fontSize: 12.5,
    color: colors.sale,
    lineHeight: 17,
  },
  aiResult: {
    gap: 8,
  },
  aiResultTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
  },
  aiTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  aiTag: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  aiTagMine: {
    backgroundColor: colors.accent,
  },
  aiTagText: {
    fontSize: 12.5,
    color: colors.accentDark,
    fontWeight: '600',
  },
  aiTagTextMine: {
    color: colors.white,
  },
  footerSlogan: {
    fontFamily: serif,
    fontStyle: 'italic',
    fontSize: 13.5,
    color: colors.faint,
    textAlign: 'center',
    marginTop: 28,
  },
});
