import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, spacing, radius, fontSize, TAB_BAR_HEIGHT } from '../lib/theme'
import { FeedItem } from '../types'
import { supabase } from '../lib/supabase'

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
  const color = vsPar < 0 ? colors.birdie : vsPar > 5 ? colors.danger : colors.textLight
  return <Text style={[styles.statValue, { color }]}>{label}</Text>
}

function FeedCard({ item, onLike }: { item: FeedItem; onLike: (id: string) => void }) {
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
        >
          <Text style={[styles.actionText, item.likedByMe && { color: colors.accent }]}>
            ♥ {item.likes}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} accessibilityRole="button">
          <Text style={styles.actionText}>◎ {item.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} accessibilityRole="button">
          <Text style={styles.actionText}>↗ share</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

function EmptyFeed() {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>no rounds yet</Text>
      <Text style={styles.emptyBody}>
        Follow other golfers to see their rounds here.
      </Text>
    </View>
  )
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return `${Math.floor(days / 7)}w ago`
}

export default function HomeScreen() {
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadFeed = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: followData } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)

    const followingIds = [user.id, ...(followData?.map((f: any) => f.following_id) ?? [])]

    const { data: rounds } = await supabase
      .from('rounds')
      .select(`
        id,
        created_at,
        gross_score,
        vs_par,
        gir_count,
        likes_count,
        comments_count,
        courses (name, location),
        profiles (id, full_name, avatar_url, handicap)
      `)
      .in('user_id', followingIds)
      .order('created_at', { ascending: false })
      .limit(30)

    const items: FeedItem[] = (rounds ?? []).map((r: any) => ({
      id: r.id,
      user: {
        id: r.profiles?.id ?? '',
        name: r.profiles?.full_name ?? 'Unknown',
        avatarUrl: r.profiles?.avatar_url ?? null,
        handicap: r.profiles?.handicap ?? 0,
      },
      courseName: r.courses?.name ?? 'Unknown course',
      courseLocation: r.courses?.location ?? '',
      timeAgo: timeAgo(r.created_at),
      grossScore: r.gross_score ?? 0,
      vsPar: r.vs_par ?? 0,
      girCount: r.gir_count ?? 0,
      likes: r.likes_count ?? 0,
      comments: r.comments_count ?? 0,
      likedByMe: false,
    }))

    setFeed(items)
  }, [])

  useEffect(() => {
    loadFeed().finally(() => setLoading(false))
  }, [loadFeed])

  async function handleRefresh() {
    setRefreshing(true)
    await loadFeed()
    setRefreshing(false)
  }

  function handleLike(id: string) {
    setFeed(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, likedByMe: !item.likedByMe, likes: item.likedByMe ? item.likes - 1 : item.likes + 1 }
          : item
      )
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>feed</Text>
      </View>
      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : (
        <FlatList
          data={feed}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <FeedCard item={item} onLike={handleLike} />}
          contentContainerStyle={[styles.list, feed.length === 0 && styles.listEmpty]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyFeed />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accent}
            />
          }
        />
      )}
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
  loader: {
    marginTop: spacing.xxl,
  },
  list: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: TAB_BAR_HEIGHT + spacing.md,
  },
  listEmpty: {
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    color: colors.textLight,
    fontSize: fontSize.lg,
    fontWeight: '500',
  },
  emptyBody: {
    color: colors.muted,
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
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
