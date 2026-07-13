import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors, shadow } from '@/theme';

interface TabIconProps {
  name: React.ComponentProps<typeof Feather>['name'];
  color: string;
  size: number;
  focused: boolean;
}

/** Icône d'onglet animée : petit rebond + balancement + point doré quand active. */
function TabIcon({ name, color, size, focused }: TabIconProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const swing = useRef(new Animated.Value(0)).current;
  const dot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (focused) {
      Animated.parallel([
        Animated.sequence([
          Animated.spring(scale, { toValue: 1.22, useNativeDriver: true, speed: 40, bounciness: 12 }),
          Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }),
        ]),
        Animated.sequence([
          Animated.timing(swing, { toValue: 1, duration: 120, useNativeDriver: true }),
          Animated.timing(swing, { toValue: -0.7, duration: 140, useNativeDriver: true }),
          Animated.timing(swing, { toValue: 0, duration: 140, useNativeDriver: true }),
        ]),
        Animated.spring(dot, { toValue: 1, useNativeDriver: true, speed: 20 }),
      ]).start();
    } else {
      Animated.timing(dot, { toValue: 0, duration: 150, useNativeDriver: true }).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focused]);

  const rotate = swing.interpolate({ inputRange: [-1, 1], outputRange: ['-14deg', '14deg'] });

  return (
    <View style={styles.iconWrap}>
      <Animated.View style={{ transform: [{ scale }, { rotate }] }}>
        <Feather name={name} size={size - 2} color={color} strokeWidth={1.5} />
      </Animated.View>
      <Animated.View style={[styles.dot, { opacity: dot, transform: [{ scale: dot }] }]} />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.faint,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 0,
          height: 64,
          paddingTop: 6,
          paddingBottom: 8,
          ...shadow.float,
        },
        tabBarLabelStyle: {
          fontSize: 9.5,
          fontWeight: '600',
          letterSpacing: 0.2,
        },
        sceneStyle: { backgroundColor: colors.ivory },
      }}
    >
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Pour toi',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name="shopping-bag" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favoris',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name="heart" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: 'Ventes Privées',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name="percent" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="zahra"
        options={{
          title: 'Conseils',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name="message-circle" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Mon style',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name="user" color={color} size={size} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    gap: 3,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gold,
  },
});
