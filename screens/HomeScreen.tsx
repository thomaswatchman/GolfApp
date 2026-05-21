import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native'
import { SkeletonCard } from '../components/Skeleton'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { spacing, radius, fontSize, TAB_BAR_HEIGHT, ColorScheme } from '../lib/theme'
import { useTheme } from '../lib/ThemeContext'
import { FeedItem } from '../types'
import { supabase } from '../lib/supabase'
import { RootStackParamList } from '../navigation/RootStack'
import { cacheGet, cacheSet } from '../lib/dataCache'

const CACHE_KEY = 'home_feed'
type Nav = NativeStackNavigationProp<RootStackParamList>

function makeStyles(c: ColorScheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    header: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: c.border },
    headerTitle: { color: c.textBright, fontSize: fontSize.xl, fontWeight: '500' },
    list: { padding: spacing.md, gap: spacing.md, paddingBottom: TAB_BAR_HEIGHT + spacing.md },
    listEmpty: { flex: 1 },
    empty: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const, gap: spacing.sm, paddingHorizontal: spacing.xl },
    emptyTitle: { color: c.textLight, fontSize: fontSize.lg, fontWeight: '500' },
    emptyBody: { color: c.muted, fontSize: fontSize.sm, textAlign: 'center' as const, lineHeight: 20 },
    card: { backgroundColor: c.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: c.border },
    cardHeader: { flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: spacing.sm },
    avatar: { width: 42, height: 42, borderRadius: radius.full, backgroundColor: c.borderLight, alignItems: 'center' as const, justifyContent: 'center' as const },
    avatarText: { color: c.textLight, fontSize: fontSize.sm, fontWeight: '500' },
    cardHeaderText: { flex: 1, marginLeft: spacing.sm },
    userName: { color: c.textBright, fontSize: fontSize.md, fontWeight: '500' },
    timeAgo: { color: c.muted, fontSize: fontSize.sm, marginTop: 2 },
    handicapBadge: { color: c.muted, fontSize: fontSize.xs, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderWidth: 1, borderColor: c.borderLight, borderRadius: radius.sm },
    courseName: { color: c.textLight, fontSize: fontSize.md, fontWeight: '500', marginBottom: 2 },
    courseLocation: { color: c.muted, fontSize: fontSize.sm, marginBottom: spacing.sm },
    statsRow: { flexDirection: 'row' as const, justifyContent: 'space-around' as const, paddingVertical: spacing.sm, borderTopWidth: 1, borderBottomWidth: 1, borderColor: c.border, marginBottom: spacing.sm },
    stat: { flex: 1, alignItems: 'center' as const },
    statValue: { color: c.textBright, fontSize: 18, fontWeight: '500' },
    statLabel: { color: c.muted, fontSize: fontSize.xs, marginTop: 2 },
    statDivider: { width: 1, backgroundColor: c.border, marginVertical: spacing.xs },
    actions: { flexDirection: 'row' as const, gap: spacing.xs },
    actionBtn: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center' as const, justifyContent: 'center' as const, minHeight: 44 },
    actionText: { color: c.muted, fontSize: fontSize.sm },
    likedText: { color: c.accent, fontSize: fontSize.sm },
    scoreGood: { color: c.birdie, fontSize: 18, fontWeight: '500' },
    scoreBad: { color: c.danger, fontSize: 18, fontWeight: '500' },
  })
}

type Styles = ReturnType<typeof makeStyles>

function Avatar({ name, styles }: { name: string; styles: Styles }) {
  const initials = name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  )
}

function ScoreLabel({ vsPar, styles }: { vsPar: number; styles: Styles }) {
  const label = vsPar === 0 ? 'E' : vsPar > 0 ? `+${vsPar}` : `${vsPar}`
  const style = vsPar < 0 ? styles.scoreGood : vsPar > 5 ? styles.scoreBad : styles.statValue
  return <Text style={style}>{label}</Text>
}

function FeedCard({ item, onLike, styles }: { item: FeedItem; onLike: (id: string) => void; styles: Styles }) {
  const navigation = useNavigation<Nav>()
  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardHeader} onPress={() => navigation.navigate('UserProfile', { userId: item.user.id })} activeOpacity={0.75}>
        <Avatar name={item.user.name} styles={styles} />
        <View style={styles.cardHeaderText}>
          <Text style={styles.userName}>{item.user.name}</Text>
          <Text style={styles.timeAgo}>{item.timeAgo}</Text>
        </View>
        <Text style={styles.handicapBadge}>hcp {item.user.handicap}</Text>
      </TouchableOpacity>

      <Text style={styles.courseName}>{item.courseName}</Text>
      <Text style={styles.courseLocation}>{item.courseLocation}</Text>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <ScoreLabel vsPar={item.vsPar} styles={styles} />
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
        <TouchableOpacity style={styles.actionBtn} onPress={() => onLike(item.id)} accessibilityRole="button">
          <Text style={item.likedByMe ? styles.likedText : styles.actionText}>♥ {item.likes}</Text>
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

function EmptyFeed({ styles }: { styles: Styles }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>no rounds yet</Text>
      <Text style={styles.emptyBody}>Follow other golfers to see their rounds here.</Text>
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
  const { colors: c } = useTheme()
  const styles = useMemo(() => makeStyles(c), [c])
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadFeed = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: followData } = await supabase.from('follows').select('following_id').eq('follower_id', user.id)
    const followingIds = [user.id, ...(followData?.map((f: any) => f.following_id) ?? [])]
    const { data: rounds } = await supabase
      .from('rounds')
      .select('id, created_at, gross_score, vs_par, gir_count, likes_count, comments_count, courses (name, location), profiles (id, full_name, avatar_url, handicap)')
      .in('user_id', followingIds)
      .order('created_at', { ascending: false })
      .limit(30)
    const items: FeedItem[] = (rounds ?? []).map((r: any) => ({
      id: r.id,
      user: { id: r.profiles?.id ?? '', name: r.profiles?.full_name ?? 'Unknown', avatarUrl: r.profiles?.avatar_url ?? null, handicap: r.profiles?.handicap ?? 0 },
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
    cacheSet(CACHE_KEY, items)
    setFeed(items)
  }, [])

  useEffect(() => {
    const cached = cacheGet<FeedItem[]>(CACHE_KEY)
    if (cached) { setFeed(cached); setLoading(false); loadFeed() }
    else { loadFeed().finally(() => setLoading(false)) }
  }, [loadFeed])

  function handleLike(id: string) {
    setFeed(prev => prev.map(item =>
      item.id === id ? { ...item, likedByMe: !item.likedByMe, likes: item.likedByMe ? item.likes - 1 : item.likes + 1 } : item
    ))
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>feed</Text>
      </View>
      {loading ? (
        <View style={styles.list}>
          <SkeletonCard lines={3} />
          <SkeletonCard lines={2} />
          <SkeletonCard lines={3} />
        </View>
      ) : (
        <FlatList
          data={feed}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <FeedCard item={item} onLike={handleLike} styles={styles} />}
          contentContainerStyle={[styles.list, feed.length === 0 && styles.listEmpty]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyFeed styles={styles} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await loadFeed(); setRefreshing(false) }} tintColor={c.accent} />}
        />
      )}
    </SafeAreaView>
  )
}
