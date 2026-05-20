import React, { useState } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native'
import { colors, spacing, radius, fontSize, TAB_BAR_HEIGHT } from '../lib/theme'
import { FeedItem } from '../types'

const MOCK_FEED: FeedItem[] = [
  {
    id: '1',
    user: { id: 'u1', name: 'James McKenna', avatarUrl: null, handicap: 8 },
    courseName: 'Pebble Beach Golf Links',
    courseLocation: 'Pebble Beach, CA',
    timeAgo: '2h ago',
    grossScore: 78,
    vsPar: 6,
    girCount: 11,
    likes: 24,
    comments: 3,
    likedByMe: false,
  },
  {
    id: '2',
    user: { id: 'u2', name: 'Sarah Callahan', avatarUrl: null, handicap: 14 },
    courseName: 'Augusta National Golf Club',
    courseLocation: 'Augusta, GA',
    timeAgo: '5h ago',
    grossScore: 88,
    vsPar: 16,
    girCount: 6,
    likes: 41,
    comments: 7,
    likedByMe: true,
  },
  {
    id: '3',
    user: { id: 'u3', name: 'Ryan Park', avatarUrl: null, handicap: 3 },
    courseName: 'Bethpage Black',
    courseLocation: 'Farmingdale, NY',
    timeAgo: '1d ago',
    grossScore: 74,
    vsPar: 2,
    girCount: 14,
    likes: 87,
    comments: 12,
    likedByMe: false,
  },
  {
    id: '4',
    user: { id: 'u4', name: 'Lauren Chu', avatarUrl: null, handicap: 18 },
    courseName: 'Torrey Pines Golf Course',
    courseLocation: 'La Jolla, CA',
    timeAgo: '2d ago',
    grossScore: 92,
    vsPar: 20,
    girCount: 4,
    likes: 15,
    comments: 2,
    likedByMe: false,
  },
]

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map(p => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  )
}

function ScoreLabel({ vsPar }: { vsPar: number }) {
  const label = vsPar === 0 ? 'E' : vsPar > 0 ? `+${vsPar}` : `${vsPar}`
  const color =
    vsPar < 0 ? colors.birdie : vsPar > 5 ? colors.danger : colors.textLight
  return <Text style={[styles.statValue, { color }]}>{label}</Text>
}

function FeedCard({
  item,
  onLike,
}: {
  item: FeedItem
  onLike: (id: string) => void
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Avatar name={item.user.name} />
        <View style={styles.cardHeaderText}>
          <Text style={styles.userName}>{item.user.name}</Text>
          <Text style={styles.timeAgo}>{item.timeAgo}</Text>
        </View>
        <Text style={styles.handicapBadge}>hcp {item.user.handicap}</Text>
      </View>

      <Text style={styles.courseName}>{item.courseName}</Text>
      <Text style={styles.courseLocation}>{item.courseLocation}</Text>

      <View style={styles.contentPlaceholder}>
        <Text style={styles.placeholderLabel}>shot map</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <ScoreLabel vsPar={item.vsPar} />
          <Text style={styles.statLabel}>vs par</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{item.grossScore}</Text>
          <Text style={styles.statLabel}>gross</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{item.girCount}/18</Text>
          <Text style={styles.statLabel}>GIR</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onLike(item.id)}
          accessibilityRole="button"
          accessibilityLabel={`Like, ${item.likes} likes`}
        >
          <Text
            style={[
              styles.actionText,
              item.likedByMe && { color: colors.accent },
            ]}
          >
            ♥ {item.likes}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          accessibilityRole="button"
          accessibilityLabel={`${item.comments} comments`}
        >
          <Text style={styles.actionText}>◎ {item.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          accessibilityRole="button"
          accessibilityLabel="Share"
        >
          <Text style={styles.actionText}>↗ share</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default function HomeScreen() {
  const [feed, setFeed] = useState(MOCK_FEED)

  function handleLike(id: string) {
    setFeed(prev =>
      prev.map(item =>
        item.id === id
          ? {
              ...item,
              likedByMe: !item.likedByMe,
              likes: item.likedByMe ? item.likes - 1 : item.likes + 1,
            }
          : item
      )
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>feed</Text>
      </View>
      <FlatList
        data={feed}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <FeedCard item={item} onLike={handleLike} />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    color: colors.textBright,
    fontSize: fontSize.xl,
    fontWeight: '500',
  },
  list: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: TAB_BAR_HEIGHT + spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.textLight,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  userName: {
    color: colors.textBright,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  timeAgo: {
    color: colors.muted,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  handicapBadge: {
    color: colors.muted,
    fontSize: fontSize.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.sm,
  },
  courseName: {
    color: colors.textLight,
    fontSize: fontSize.md,
    fontWeight: '500',
    marginBottom: 2,
  },
  courseLocation: {
    color: colors.muted,
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },
  contentPlaceholder: {
    height: 160,
    backgroundColor: colors.border,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  placeholderLabel: {
    color: colors.inactive,
    fontSize: fontSize.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: colors.textBright,
    fontSize: 18,
    fontWeight: '500',
  },
  statLabel: {
    color: colors.muted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  actionText: {
    color: colors.muted,
    fontSize: fontSize.sm,
  },
})
