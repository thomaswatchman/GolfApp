import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { colors, spacing, radius, TAB_BAR_HEIGHT } from '../lib/theme'

const ICONS: Record<string, string> = {
  Home: '⌂',
  Explore: '◎',
  Play: '⛳',
  Network: '◈',
  Profile: '◯',
}

export default function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key]
        const label = options.title ?? route.name
        const isFocused = state.index === index
        const isPlay = route.name === 'Play'

        function onPress() {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name)
          }
        }

        if (isPlay) {
          return (
            <View key={route.key} style={styles.playWrapper}>
              <TouchableOpacity
                onPress={onPress}
                style={[styles.playButton, isFocused && styles.playButtonActive]}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Start a round"
              >
                <Text style={styles.playIcon}>{ICONS[route.name]}</Text>
              </TouchableOpacity>
            </View>
          )
        }

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tab}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={label}
          >
            <Text style={[styles.icon, isFocused && styles.iconActive]}>
              {ICONS[route.name] ?? '·'}
            </Text>
            <Text style={[styles.label, isFocused && styles.labelActive]}>{label}</Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: TAB_BAR_HEIGHT,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.sm,
    paddingTop: spacing.sm,
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.xs,
    minHeight: 44,
  },
  icon: {
    fontSize: 20,
    color: colors.inactive,
    marginBottom: 2,
  },
  iconActive: {
    color: colors.accent,
  },
  label: {
    fontSize: 11,
    color: colors.inactive,
    fontWeight: '400',
  },
  labelActive: {
    color: colors.accent,
    fontWeight: '500',
  },
  playWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.xs,
  },
  playButton: {
    width: 58,
    height: 58,
    borderRadius: radius.full,
    backgroundColor: colors.inactive,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    borderWidth: 3,
    borderColor: colors.bg,
  },
  playButtonActive: {
    backgroundColor: colors.accent,
  },
  playIcon: {
    fontSize: 24,
  },
})
