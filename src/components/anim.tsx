import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  dy?: number;
  style?: StyleProp<ViewStyle>;
}

/** Entrée en fondu + glissement vers le haut (éditorial). */
export function FadeInView({ children, delay = 0, duration = 550, dy = 18, style }: FadeInViewProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [progress, delay, duration]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [dy, 0] }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

interface ScalePressableProps extends PressableProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  pressedScale?: number;
  /** Au survol (web / souris) : la carte se soulève légèrement. */
  hoverLift?: boolean;
}

/** Pressable avec micro-rebond au toucher et lift au survol — feedback premium. */
export function ScalePressable({
  children,
  style,
  pressedScale = 0.96,
  hoverLift = false,
  onPressIn,
  onPressOut,
  onHoverIn,
  onHoverOut,
  ...rest
}: ScalePressableProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const lift = useRef(new Animated.Value(0)).current;

  const hoverScale = lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] });
  const hoverY = lift.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

  return (
    <Pressable
      {...rest}
      onPressIn={(e) => {
        Animated.spring(scale, {
          toValue: pressedScale,
          useNativeDriver: true,
          speed: 40,
          bounciness: 4,
        }).start();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 30,
          bounciness: 8,
        }).start();
        onPressOut?.(e);
      }}
      onHoverIn={(e) => {
        if (hoverLift) {
          Animated.spring(lift, { toValue: 1, useNativeDriver: true, speed: 30 }).start();
        }
        onHoverIn?.(e);
      }}
      onHoverOut={(e) => {
        if (hoverLift) {
          Animated.spring(lift, { toValue: 0, useNativeDriver: true, speed: 30 }).start();
        }
        onHoverOut?.(e);
      }}
    >
      <Animated.View
        style={[
          style,
          {
            transform: [
              { scale: Animated.multiply(scale, hoverScale) },
              { translateY: hoverY },
            ],
          },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

interface PulseViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  minScale?: number;
  maxScale?: number;
  duration?: number;
}

/** Pulsation douce en boucle (splash, étincelles). */
export function PulseView({
  children,
  style,
  minScale = 1,
  maxScale = 1.12,
  duration = 900,
}: PulseViewProps) {
  const scale = useRef(new Animated.Value(minScale)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: maxScale,
          duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: minScale,
          duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scale, minScale, maxScale, duration]);

  return <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>;
}

/** Pop élastique déclenché quand `trigger` passe à true (sélections, favoris). */
export function usePopAnimation(trigger: boolean) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (trigger) {
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.12, useNativeDriver: true, speed: 40, bounciness: 12 }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }),
      ]).start();
    }
  }, [trigger, scale]);

  return scale;
}
