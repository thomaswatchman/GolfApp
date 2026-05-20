import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, spacing, radius, fontSize, TAB_BAR_HEIGHT } from '../lib/theme'
import { supabase } from '../lib/supabase'

type NetworkTab = 'following' | 'suggested'

interface NetworkPlayer {
  id: string
  name: string
  avatarUrl: string | null
  handicap: number
  homeCourse: string | null
  lastRound: string | null
  mutuals: number
  isFollowing: boolean
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  )
}

function PlayerRow({
  player,
  showMutuals,
  onToggleFollow,
}: {
  player: NetworkPlayer
  showMutuals: boolean
  onToggleFollow: (id: string) => void
}) {
  return (
    <TouchableOpacity style={styles.playerRow} activeOpacity={0.75}>
      <Avatar name={player.name} />
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>{player.name}</Text>
        <Text style={styles.playerMeta}>
          hcp {player.handicap}{player.homeCourse ? ` · ${player.homeCourse}` : ''}
        </Text>
        {showMutuals && player.mutuals > 0 && (
          <Text style={styles.playerSub}>
            {player.mutuals} mutual{player.mutuals !== 1 ? 's' : ''}
          </Text>
        )}
        {!showMutuals && player.lastRound && (
          <Text style={styles.playerSub}>last round {player.lastRound}</Text>
        )}
      </View>
      <TouchableOpacity
        style={[styles.followBtn, player.isFollowing && styles.followingBtn]}
        onPress={() => onToggleFollow(player.id)}
        activeOpacity={0.75}
        accessibilityRole="button"
      >
        <Text style={[styles.followBtnText, player.isFollowing && styles.followingBtnText]}>
          {player.isFollowing ? 'following' : 'follow'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  )
}

function timeAgo(dateStr: string | null): string | null {
  if (!dateStr) return null
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return '1d ago'
  if (days < 7) return `${days}d ago`
  return `${Math.floor(days / 7)}w ago`
}

export default function NetworkScreen() {
  const [activeTab, setActiveTab] = useState<NetworkTab>('following')
  const [search, setSearch] = useState('')
  const [following, setFollowing] = useState<NetworkPlayer[]>([])
  const [suggested, setSuggested] = useState<NetworkPlayer[]>([])
  const [loadingFollowing, setLoadingFollowing] = useState(true)
  const [loadingSuggested, setLoadingSuggested] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadFollowing = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('follows')
      .select(`
        following_id,
        profiles!follows_following_id_fkey (
          id, full_name, avatar_url, handicap, home_course,
          rounds (created_at)
        )
      `)
      .eq('follower_id', user.id)
      .order('created_at', { ascending: false })

    setFollowing(
      (data ?? []).map((row: any) => {
        const p = row.profiles
        const lastRoundDate = p?.rounds?.[0]?.created_at ?? null
        return {
          id: p?.id ?? row.following_id,
          name: p?.full_name ?? 'Unknown',
          avatarUrl: p?.avatar_url ?? null,
          handicap: p?.handicap ?? 0,
          homeCourse: p?.home_course ?? null,
          lastRound: timeAgo(lastRoundDate),
          mutuals: 0,
          isFollowing: true,
        }
      })
    )
  }, [])

  const loadSuggested = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: followData } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)

    const followingIds = [user.id, ...(followData?.map((f: any) => f.following_id) ?? [])]

    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, handicap, home_course')
      .not('id', 'in', `(${followingIds.join(',')})`)
      .limit(20)

    setSuggested(
      (data ?? []).map((p: any) => ({
        id: p.id,
        name: p.full_name ?? 'Unknown',
        avatarUrl: p.avatar_url ?? null,
        handicap: p.handicap ?? 0,
        homeCourse: p.home_course ?? null,
        lastRound: null,
        mutuals: 0,
        isFollowing: false,
      }))
    )
  }, [])

  useEffect(() => {
    loadFollowing().finally(() => setLoadingFollowing(false))
    loadSuggested().finally(() => setLoadingSuggested(false))
  }, [loadFollowing, loadSuggested])

  async function handleRefresh() {
    setRefreshing(true)
    await Promise.all([loadFollowing(), loadSuggested()])
    setRefreshing(false)
  }

  async function toggleFollow(playerId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const isCurrentlyFollowing = following.some(p => p.id === playerId)

    if (isCurrentlyFollowing) {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', playerId)
      setFollowing(prev => prev.filter(p => p.id !== playerId))
      setSuggested(prev => prev.map(p => p.id === playerId ? { ...p, isFollowing: false } : p))
    } else {
      await supabase
        .from('follows')
        .insert({ follower_id: user.id, following_id: playerId })
      setSuggested(prev => prev.map(p => p.id === playerId ? { ...p, isFollowing: true } : p))
    }
  }

  const data = activeTab === 'following' ? following : suggested
  const loading = activeTab === 'following' ? loadingFollowing : loadingSuggested
  const filtered = data.filter(
    p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.homeCourse ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>network</Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="find players"
          placeholderTextColor={colors.inactive}
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.tabRow}>
        {(['following', 'suggested'] as NetworkTab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
            accessibilityRole="tab"
          >
            <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <PlayerRow
              player={item}
              showMutuals={activeTab === 'suggested'}
              onToggleFollow={toggleFollow}
            />
          )}
          contentContainerStyle={[styles.list, filtered.length === 0 && styles.listEmpty]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState message={activeTab === 'following' ? 'not following anyone yet' : 'no suggestions'} />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { color: colors.textBright, fontSize: fontSize.xl, fontWeight: '500' },
  searchRow: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  searchInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textBright,
    fontSize: fontSize.md,
    minHeight: 44,
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  tabBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    minHeight: 44,
    justifyContent: 'center',
  },
  tabBtnActive: { borderBottomColor: colors.accent },
  tabBtnText: { color: colors.muted, fontSize: fontSize.md },
  tabBtnTextActive: { color: colors.accent, fontWeight: '500' },
  loader: { marginTop: spacing.xxl },
  list: { paddingBottom: TAB_BAR_HEIGHT + spacing.md },
  listEmpty: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: spacing.xxl },
  emptyText: { color: colors.muted, fontSize: fontSize.md },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 72,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: radius.full,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  avatarText: { color: colors.textLight, fontSize: fontSize.sm, fontWeight: '500' },
  playerInfo: { flex: 1 },
  playerName: { color: colors.textBright, fontSize: fontSize.md, fontWeight: '500' },
  playerMeta: { color: colors.muted, fontSize: fontSize.sm, marginTop: 1 },
  playerSub: { color: colors.inactive, fontSize: fontSize.xs, marginTop: 1 },
  followBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.accent,
    minHeight: 36,
    justifyContent: 'center',
    minWidth: 80,
    alignItems: 'center',
  },
  followingBtn: { borderColor: colors.borderLight, backgroundColor: colors.borderLight },
  followBtnText: { color: colors.accent, fontSize: fontSize.sm, fontWeight: '500' },
  followingBtnText: { color: colors.muted },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.md + 46 + spacing.sm,
  },
})
