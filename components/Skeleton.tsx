import React, { useEffect, useRef } from 'react'
import { Animated, StyleSheet, View, ViewStyle } from 'react-native'
import { colors, radius } from '../lib/theme'

interface SkeletonProps {
  width?: number | `${number}%`
  height?: number
  borderRadius?: number
  style?: ViewStyle
}

export function Skeleton({ width = '100%', height = 16, borderRadius = radius.sm, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start()
  }, [opacity])

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: colors.borderLight, opacity },
        style,
      ]}
    />
  )
}

// Pre-built skeleton shapes for common patterns

export function SkeletonCard({ lines = 2 }: { lines?: number }) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Skeleton width={42} height={42} borderRadius={radius.full} />
        <View style={styles.headerText}>
          <Skeleton width="55%" height={14} />
          <Skeleton width="30%" height={11} style={{ marginTop: 6 }} />
        </View>
      </View>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? '65%' : '100%'} height={12} style={{ marginTop: 8 }} />
      ))}
    </View>
  )
}

export function SkeletonListItem() {
  return (
    <View style={styles.listItem}>
      <View style={styles.listItemLeft}>
        <Skeleton width={46} height={46} borderRadius={radius.full} />
        <View style={styles.listItemText}>
          <Skeleton width="60%" height={14} />
          <Skeleton width="40%" height={11} style={{ marginTop: 6 }} />
        </View>
      </View>
      <Skeleton width={72} height={32} borderRadius={radius.full} />
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  headerText: { flex: 1, marginLeft: 10, gap: 0 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 72,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  listItemText: { marginLeft: 10, flex: 1, gap: 0 },
})
