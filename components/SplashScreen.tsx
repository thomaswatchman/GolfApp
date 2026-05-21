import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated } from 'react-native'
import { colors, fontSize, spacing } from '../lib/theme'

export default function SplashScreen() {
  const scale = useRef(new Animated.Value(0.85)).current
  const opacity = useRef(new Animated.Value(0)).current
  const dotOpacity = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    // Fade + scale in
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start()

    // Pulse the dot
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(dotOpacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity, transform: [{ scale }] }]}>
        <Text style={styles.emoji}>🏌️</Text>
        <Text style={styles.wordmark}>golf</Text>
        <Animated.View style={[styles.dot, { opacity: dotOpacity }]} />
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: spacing.md,
  },
  emoji: {
    fontSize: 64,
  },
  wordmark: {
    color: colors.accent,
    fontSize: 36,
    fontWeight: '500',
    letterSpacing: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginTop: spacing.sm,
  },
})
