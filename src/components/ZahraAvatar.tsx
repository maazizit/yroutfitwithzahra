import React, { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { colors } from '@/theme';

/**
 * Humeur de l'avatar — pilote les micro-animations.
 * - idle : respiration douce
 * - thinking : réflexion (pendant l'appel Gemini)
 * - speaking : réponse reçue
 * - listening : la cliente tape sa question
 */
export type ZahraMood = 'idle' | 'thinking' | 'speaking' | 'listening';

/**
 * Avatar de Zahra — portrait vectoriel stylisé (hijab noir, blazer).
 * Pour ta vraie photo : `assets/zahra.jpg` puis PHOTO ci-dessous.
 */
const PHOTO: number | null = null;

interface ZahraAvatarProps {
  size?: number;
  mood?: ZahraMood;
  /** Entrée fade + slide (header du chat à l'ouverture). */
  entrance?: boolean;
}

function AvatarArt({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 96 96">
      <Circle cx={48} cy={48} r={48} fill={colors.accentSoft} />
      <Path
        d="M48 12c-20 0-30 15-30 32 0 12 4 20 8 26l4 14h36l4-14c4-6 8-14 8-26 0-17-10-32-30-32Z"
        fill="#211D1A"
      />
      <Ellipse cx={48} cy={46} rx={14.5} ry={17.5} fill="#EAC0A2" />
      <Path
        d="M48 21c-13 0-20 11-20 24 0 4 .8 8 2 11l3-2c-1-3-1.6-6-1.6-9C31.4 32.5 38 26 48 26s16.6 6.5 16.6 19c0 3-.6 6-1.6 9l3 2c1.2-3 2-7 2-11 0-13-7-24-20-24Z"
        fill="#151210"
      />
      <Path d="M39 41.5c2-1.6 5-1.8 7-.8" stroke="#4A3526" strokeWidth={1.6} strokeLinecap="round" fill="none" />
      <Path d="M57 41.5c-2-1.6-5-1.8-7-.8" stroke="#4A3526" strokeWidth={1.6} strokeLinecap="round" fill="none" />
      <Ellipse cx={42} cy={46.5} rx={2.1} ry={2.6} fill="#3A2A1E" />
      <Ellipse cx={54} cy={46.5} rx={2.1} ry={2.6} fill="#3A2A1E" />
      <Path d="M48 49v5.5c0 .9-1.2 1.6-2.2 1.2" stroke="#D8A583" strokeWidth={1.4} strokeLinecap="round" fill="none" />
      <Path d="M44 59c1.4 1.2 2.7 1.6 4 1.6s2.6-.4 4-1.6c-1.2-1.5-2.6-2.1-4-2.1s-2.8.6-4 2.1Z" fill={colors.accent} />
      <Path
        d="M31 55c2 12 8 18 17 20 9-2 15-8 17-20 2 10-1 19-5 25l-4 6H40l-4-6c-4-6-7-15-5-25Z"
        fill="#211D1A"
      />
      <Path d="M20 96c2-14 12-20 28-20s26 6 28 20H20Z" fill="#1B1815" />
      <Path d="M42 78l6 8 6-8" stroke="#3A332C" strokeWidth={2} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

function useMoodMotion(mood: ZahraMood) {
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  const translateY = useSharedValue(0);
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(1);

  useEffect(() => {
    cancelAnimation(scale);
    cancelAnimation(rotate);
    cancelAnimation(translateY);
    cancelAnimation(ringScale);
    cancelAnimation(ringOpacity);

    const ease = Easing.inOut(Easing.sin);

    if (mood === 'thinking') {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 650, easing: ease }),
          withTiming(1, { duration: 650, easing: ease }),
        ),
        -1,
        true,
      );
      rotate.value = withRepeat(
        withSequence(
          withTiming(-5, { duration: 800, easing: ease }),
          withTiming(5, { duration: 800, easing: ease }),
        ),
        -1,
        true,
      );
      ringScale.value = withRepeat(
        withSequence(
          withTiming(1.14, { duration: 550, easing: ease }),
          withTiming(1, { duration: 550, easing: ease }),
        ),
        -1,
        true,
      );
      ringOpacity.value = withRepeat(
        withSequence(withTiming(0.55, { duration: 500 }), withTiming(1, { duration: 500 })),
        -1,
        true,
      );
      translateY.value = withTiming(0, { duration: 200 });
      return;
    }

    if (mood === 'speaking') {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.06, { duration: 160, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 220, easing: Easing.inOut(Easing.quad) }),
        ),
        3,
        false,
      );
      rotate.value = withTiming(0, { duration: 180 });
      translateY.value = withTiming(-1, { duration: 180 });
      ringScale.value = withTiming(1.04, { duration: 200 });
      ringOpacity.value = withTiming(1, { duration: 200 });
      return;
    }

    if (mood === 'listening') {
      scale.value = withTiming(1.03, { duration: 280, easing: ease });
      rotate.value = withTiming(4, { duration: 320, easing: ease });
      translateY.value = withTiming(2, { duration: 280, easing: ease });
      ringScale.value = withTiming(1.02, { duration: 280 });
      ringOpacity.value = withTiming(0.9, { duration: 280 });
      return;
    }

    // idle — respiration visible
    scale.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 1800, easing: ease }),
        withTiming(1, { duration: 1800, easing: ease }),
      ),
      -1,
      true,
    );
    rotate.value = withTiming(0, { duration: 400 });
    translateY.value = withTiming(0, { duration: 400 });
    ringScale.value = withTiming(1, { duration: 400 });
    ringOpacity.value = withTiming(1, { duration: 400 });
  }, [mood, ringOpacity, ringScale, rotate, scale, translateY]);

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  return { bodyStyle, ringStyle };
}

export function ZahraAvatar({ size = 40, mood = 'idle', entrance = false }: ZahraAvatarProps) {
  const ringSize = size + 4;
  const { bodyStyle, ringStyle } = useMoodMotion(mood);

  const inner = PHOTO ? (
    <Image
      source={PHOTO}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      accessibilityLabel="Zahra"
    />
  ) : (
    <AvatarArt size={size} />
  );

  const content = (
    <Animated.View style={[styles.wrap, ringStyle, { width: ringSize, height: ringSize, borderRadius: ringSize / 2 }]}>
      <Animated.View style={bodyStyle}>{inner}</Animated.View>
      {mood === 'thinking' ? (
        <View style={styles.thoughtDots} pointerEvents="none">
          <View style={[styles.thoughtDot, styles.thoughtDot1]} />
          <View style={[styles.thoughtDot, styles.thoughtDot2]} />
          <View style={[styles.thoughtDot, styles.thoughtDot3]} />
        </View>
      ) : null}
    </Animated.View>
  );

  if (entrance) {
    return (
      <Animated.View entering={FadeInDown.duration(520).delay(80).springify().damping(16)}>
        {content}
      </Animated.View>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.gold,
    backgroundColor: colors.card,
    overflow: 'visible',
  },
  thoughtDots: {
    position: 'absolute',
    top: -2,
    right: -10,
    flexDirection: 'row',
    gap: 3,
  },
  thoughtDot: {
    borderRadius: 99,
    backgroundColor: colors.accent,
    opacity: 0.85,
  },
  thoughtDot1: { width: 4, height: 4, marginTop: 6 },
  thoughtDot2: { width: 5, height: 5, marginTop: 2 },
  thoughtDot3: { width: 6, height: 6 },
});
