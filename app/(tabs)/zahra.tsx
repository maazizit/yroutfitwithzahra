import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FadeInView, ScalePressable } from '@/components/anim';
import { ZahraAvatar, type ZahraMood } from '@/components/ZahraAvatar';
import { useProfile } from '@/lib/profile';
import { askZahra, QUICK_PROMPTS, welcomeMessage, type ZahraMessage } from '@/lib/zahra';
import { colors, radius, serif, shadow } from '@/theme';

function TypingDots() {
  const dots = [useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current];

  useEffect(() => {
    const loops = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(dot, { toValue: 1, duration: 320, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 320, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.delay((2 - i) * 160),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.typingRow}>
      {dots.map((dot, i) => (
        <Animated.View key={i} style={[styles.typingDot, { opacity: dot }]} />
      ))}
    </View>
  );
}

function Bubble({ message, mood }: { message: ZahraMessage; mood?: ZahraMood }) {
  const isZahra = message.role === 'zahra';
  return (
    <FadeInView dy={10} duration={350}>
      <View style={[styles.bubbleRow, isZahra ? styles.rowZahra : styles.rowUser]}>
        {isZahra && (
          <View style={styles.bubbleAvatar}>
            <ZahraAvatar size={30} mood={mood ?? 'idle'} />
          </View>
        )}
        <View style={[styles.bubble, isZahra ? styles.bubbleZahra : styles.bubbleUser]}>
          <Text style={[styles.bubbleText, !isZahra && styles.bubbleTextUser]}>{message.text}</Text>
        </View>
      </View>
    </FadeInView>
  );
}

export default function ZahraScreen() {
  const router = useRouter();
  const { profile, loading: profileLoading } = useProfile();
  const [messages, setMessages] = useState<ZahraMessage[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const listRef = useRef<FlatList<ZahraMessage>>(null);
  const counter = useRef(0);

  const mood: ZahraMood = thinking
    ? 'thinking'
    : speaking
      ? 'speaking'
      : inputFocused
        ? 'listening'
        : 'idle';

  const statusLabel =
    mood === 'thinking'
      ? 'Zahra réfléchit à ton look…'
      : mood === 'speaking'
        ? 'Zahra te répond'
        : mood === 'listening'
          ? 'Zahra t\'écoute'
          : 'Ta styliste est en ligne';

  useEffect(() => {
    if (profile && messages.length === 0) {
      setMessages([welcomeMessage(profile)]);
    }
  }, [profile, messages.length]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.role !== 'zahra' || last.id === 'welcome') return;
    setSpeaking(true);
    const timer = setTimeout(() => setSpeaking(false), 2800);
    return () => clearTimeout(timer);
  }, [messages]);

  const send = useCallback(
    async (raw?: string) => {
      const text = (raw ?? input).trim();
      if (!text || thinking || !profile) return;
      setInput('');
      counter.current += 1;
      const userMessage: ZahraMessage = { id: `u-${counter.current}`, role: 'user', text };
      setMessages((prev) => [...prev, userMessage]);
      setThinking(true);
      try {
        const reply = await askZahra(text, profile);
        counter.current += 1;
        setMessages((prev) => [...prev, { id: `z-${counter.current}`, role: 'zahra', text: reply }]);
      } finally {
        setThinking(false);
      }
    },
    [input, thinking, profile],
  );

  useEffect(() => {
    const timer = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 120);
    return () => clearTimeout(timer);
  }, [messages, thinking]);

  if (profileLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ZahraAvatar size={56} mood="idle" entrance />
          <ActivityIndicator color={colors.accent} style={{ marginTop: 16 }} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ZahraAvatar size={56} mood="idle" entrance />
          <Text style={styles.emptyTitle}>Conseils with Zahra</Text>
          <Text style={styles.emptyText}>Crée d'abord ton profil de style pour que Zahra te connaisse.</Text>
          <Pressable style={styles.emptyCta} onPress={() => router.push('/onboarding')}>
            <Text style={styles.emptyCtaText}>Créer mon profil</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <ZahraAvatar size={44} mood={mood} entrance />
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>
            Conseils <Text style={styles.headerWith}>with</Text> Zahra
          </Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, thinking && styles.statusDotThinking]} />
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => (
            <Bubble
              message={item}
              mood={item.role === 'zahra' && item.id === messages[messages.length - 1]?.id ? mood : 'idle'}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            thinking ? (
              <View style={[styles.bubbleRow, styles.rowZahra]}>
                <View style={styles.bubbleAvatar}>
                  <ZahraAvatar size={30} mood="thinking" />
                </View>
                <View style={[styles.bubble, styles.bubbleZahra, styles.thinkingBubble]}>
                  <Text style={styles.thinkingText}>Je regarde ce qui te mettra en valeur…</Text>
                  <TypingDots />
                </View>
              </View>
            ) : null
          }
        />

        <View style={styles.quickWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRow}>
            {QUICK_PROMPTS.map((q) => (
              <ScalePressable key={q} style={styles.quickChip} onPress={() => send(q)}>
                <Text style={styles.quickChipText}>{q}</Text>
              </ScalePressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Demande un conseil à Zahra…"
            placeholderTextColor={colors.faint}
            value={input}
            onChangeText={setInput}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            onSubmitEditing={() => send()}
            returnKeyType="send"
            multiline
          />
          <ScalePressable
            onPress={() => send()}
            disabled={!input.trim() || thinking}
            style={[styles.sendButton, (!input.trim() || thinking) && styles.sendDisabled]}
            accessibilityRole="button"
            accessibilityLabel="Envoyer"
          >
            <Text style={styles.sendIcon}>↑</Text>
          </ScalePressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.ivory,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.ivory,
  },
  headerText: {
    gap: 2,
  },
  headerTitle: {
    fontFamily: serif,
    fontSize: 19,
    color: colors.ink,
  },
  headerWith: {
    fontStyle: 'italic',
    color: colors.accent,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#6FA97A',
  },
  statusDotThinking: {
    backgroundColor: colors.accent,
  },
  statusText: {
    fontSize: 11.5,
    color: colors.muted,
  },
  list: {
    padding: 16,
    gap: 12,
    paddingBottom: 8,
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  rowZahra: {
    justifyContent: 'flex-start',
    paddingRight: 40,
  },
  rowUser: {
    justifyContent: 'flex-end',
    paddingLeft: 40,
  },
  bubbleAvatar: {
    marginBottom: 2,
  },
  bubble: {
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 11,
    maxWidth: '100%',
    ...shadow.card,
  },
  bubbleZahra: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 6,
  },
  bubbleUser: {
    backgroundColor: colors.accent,
    borderBottomRightRadius: 6,
  },
  bubbleText: {
    fontSize: 14.5,
    lineHeight: 21,
    color: colors.ink,
  },
  bubbleTextUser: {
    color: colors.white,
  },
  typingRow: {
    flexDirection: 'row',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  thinkingBubble: {
    gap: 6,
  },
  thinkingText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: colors.muted,
  },
  quickWrap: {
    paddingVertical: 8,
  },
  quickRow: {
    paddingHorizontal: 14,
    gap: 8,
  },
  quickChip: {
    backgroundColor: colors.goldSoft,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#EADDC2',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  quickChipText: {
    fontSize: 13,
    color: colors.ink,
    fontWeight: '500',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 2,
  },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: 15,
    paddingTop: 11,
    paddingBottom: 11,
    fontSize: 14.5,
    color: colors.ink,
    maxHeight: 110,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: {
    opacity: 0.35,
  },
  sendIcon: {
    color: colors.gold,
    fontSize: 20,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: serif,
    fontSize: 22,
    color: colors.ink,
    textAlign: 'center',
    marginTop: 8,
  },
  emptyText: {
    fontFamily: serif,
    fontSize: 15,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyCta: {
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 8,
  },
  emptyCtaText: {
    color: colors.white,
    fontWeight: '600',
  },
});
