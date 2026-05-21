import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SkeletonListItem } from '../components/Skeleton'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { spacing, radius, fontSize, TAB_BAR_HEIGHT, ColorScheme } from '../lib/theme'
import { useTheme } from '../lib/ThemeContext'
import { supabase } from '../lib/supabase'
import { RootStackParamList } from '../navigation/RootStack'
import { cacheGet, cacheSet } from '../lib/dataCache'

const CACHE_FOLLOWING = 'network_following'
const CACHE_SUGGESTED = 'network_suggested'
type Nav = NativeStackNavigationProp<RootStackParamList>
type NetworkTab = 'following' | 'suggested'

interface NetworkPlayer {
  id: string; name: string; avatarUrl: string | null; handicap: number
  homeCourse: string | null; lastRound: string | null; mutuals: number; isFollowing: boolean
}

function makeStyles(c: ColorScheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    header: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: c.border },
    headerTitle: { color: c.textBright, fontSize: fontSize.xl, fontWeight: '500' },
    searchRow: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
    searchInput: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: c.textBright, fontSize: fontSize.md, minHeight: 44 },
    tabRow: { flexDirection: 'row' as const, borderBottomWidth: 1, borderBottomColor: c.border, paddingHorizontal: spacing.md },
    tabBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, marginRight: spacing.sm, borderBottomWidth: 2, borderBottomColor: 'transparent', minHeight: 44, justifyContent: 'center' as const },
    tabBtnActive: { borderBottomColor: c.accent },
    tabBtnText: { color: c.muted, fontSize: fontSize.md },
    tabBtnTextActive: { color: c.accent, fontWeight: '500' },
    list: { paddingBottom: TAB_BAR_HEIGHT + spacing.md },
    listEmpty: { flex: 1 },
    empty: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const, paddingTop: spacing.xxl },
    emptyText: { color: c.muted, fontSize: fontSize.md },
    playerRow: { flexDirection: 'row' as const, alignItems: 'center' as const, paddingHorizontal: spacing.md, paddingVertical: spacing.md, minHeight: 72 },
    avatar: { width: 46, height: 46, borderRadius: radius.full, backgroundColor: c.borderLight, alignItems: 'center' as const, justifyContent: 'center' as const, marginRight: spacing.sm },
    avatarText: { color: c.textLight, fontSize: fontSize.sm, fontWeight: '500' },
    playerInfo: { flex: 1 },
    playerName: { color: c.textBright, fontSize: fontSize.md, fontWeight: '500' },
    playerMeta: { color: c.muted, fontSize: fontSize.sm, marginTop: 1 },
    playerSub: { color: c.inactive, fontSize: fontSize.xs, marginTop: 1 },
    followBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1, borderColor: c.accent, minHeight: 36, justifyContent: 'center' as const, minWidth: 80, alignItems: 'center' as const },
    followingBtn: { borderColor: c.borderLight, backgroundColor: c.borderLight },
    followBtnText: { color: c.accent, fontSize: fontSize.sm, fontWeight: '500' },
    followingBtnText: { color: c.muted },
    separator: { height: 1, backgroundColor: c.border, marginLeft: spacing.md + 46 + spacing.sm },
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

function PlayerRow({ player, showMutuals, onToggleFollow, onPress, styles }: {
  player: NetworkPlayer; showMutuals: boolean
  onToggleFollow: (id: string) => void; onPress: () => void; styles: Styles
}) {
  return (
    <TouchableOpacity style={styles.playerRow} activeOpacity={0.75} onPress={onPress}>
      <Avatar name={player.name} styles={styles} />
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>{player.name}</Text>
        <Text style={styles.playerMeta}>hcp {player.handicap}{player.homeCourse ? ` · ${player.homeCourse}` : ''}</Text>
        {showMutuals && player.mutuals > 0 && <Text style={styles.playerSub}>{player.mutuals} mutual{player.mutuals !== 1 ? 's' : ''}</Text>}
        {!showMutuals && player.lastRound && <Text style={styles.playerSub}>last round {player.lastRound}</Text>}
      </View>
      <TouchableOpacity style={[styles.followBtn, player.isFollowing && styles.followingBtn]} onPress={() => onToggleFollow(player.id)} activeOpacity={0.75} accessibilityRole="button">
        <Text style={[styles.followBtnText, player.isFollowing && styles.followingBtnText]}>{player.isFollowing ? 'following' : 'follow'}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  )
}

function timeAgo(dateStr: string | null): string | null {
  if (!dateStr) return null
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return '1d ago'
  if (days < 7) return `${days}d ago`
  return `${Math.floor(days / 7)}w ago`
}

export default function NetworkScreen() {
  const { colors: c } = useTheme()
  const styles = useMemo(() => makeStyles(c), [c])
  const navigation = useNavigation<Nav>()
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
      .select('following_id, profiles!follows_following_id_fkey (id, full_name, avatar_url, handicap, home_course, rounds (created_at))')
      .eq('follower_id', user.id)
      .order('created_at', { ascending: false })
    const result = (data ?? []).map((row: any) => {
      const p = row.profiles
      return { id: p?.id ?? row.following_id, name: p?.full_name ?? 'Unknown', avatarUrl: p?.avatar_url ?? null, handicap: p?.handicap ?? 0, homeCourse: p?.home_course ?? null, lastRound: timeAgo(p?.rounds?.[0]?.created_at ?? null), mutuals: 0, isFollowing: true }
    })
    cacheSet(CACHE_FOLLOWING, result)
    setFollowing(result)
  }, [])

  const loadSuggested = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: followData } = await supabase.from('follows').select('following_id').eq('follower_id', user.id)
    const followingIds = [user.id, ...(followData?.map((f: any) => f.following_id) ?? [])]
    const { data } = await supabase.from('profiles').select('id, full_name, avatar_url, handicap, home_course').not('id', 'in', `(${followingIds.join(',')})`).neq('id', user.id).limit(20)
    const result = (data ?? []).map((p: any) => ({ id: p.id, name: p.full_name ?? 'Unknown', avatarUrl: p.avatar_url ?? null, handicap: p.handicap ?? 0, homeCourse: p.home_course ?? null, lastRound: null, mutuals: 0, isFollowing: false }))
    cacheSet(CACHE_SUGGESTED, result)
    setSuggested(result)
  }, [])

  useEffect(() => {
    const cachedF = cacheGet<NetworkPlayer[]>(CACHE_FOLLOWING)
    const cachedS = cacheGet<NetworkPlayer[]>(CACHE_SUGGESTED)
    if (cachedF) { setFollowing(cachedF); setLoadingFollowing(false); loadFollowing() }
    else { loadFollowing().finally(() => setLoadingFollowing(false)) }
    if (cachedS) { setSuggested(cachedS); setLoadingSuggested(false); loadSuggested() }
    else { loadSuggested().finally(() => setLoadingSuggested(false)) }
  }, [loadFollowing, loadSuggested])

  async function toggleFollow(playerId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const isCurrentlyFollowing = following.some(p => p.id === playerId) || suggested.find(p => p.id === playerId)?.isFollowing === true
    if (isCurrentlyFollowing) {
      const { error } = await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', playerId)
      if (!error) { setFollowing(prev => prev.filter(p => p.id !== playerId)); setSuggested(prev => prev.map(p => p.id === playerId ? { ...p, isFollowing: false } : p)) }
    } else {
      const { error } = await supabase.from('follows').insert({ follower_id: user.id, following_id: playerId })
      if (!error) {
        const nf = suggested.find(p => p.id === playerId)
        if (nf) setFollowing(prev => [...prev, { ...nf, isFollowing: true }])
        setSuggested(prev => prev.map(p => p.id === playerId ? { ...p, isFollowing: true } : p))
      }
    }
  }

  const data = activeTab === 'following' ? following : suggested
  const loading = activeTab === 'following' ? loadingFollowing : loadingSuggested
  const filtered = data.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.homeCourse ?? '').toLowerCase().includes(search.toLowerCase()))

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>network</Text>
      </View>
      <View style={styles.searchRow}>
        <TextInput style={styles.searchInput} placeholder="find players" placeholderTextColor={c.inactive} value={search} onChangeText={setSearch} clearButtonMode="while-editing" autoCapitalize="none" autoCorrect={false} />
      </View>
      <View style={styles.tabRow}>
        {(['following', 'suggested'] as NetworkTab[]).map(tab => (
          <TouchableOpacity key={tab} style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]} onPress={() => setActiveTab(tab)} accessibilityRole="tab">
            <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? (
        <View><SkeletonListItem /><SkeletonListItem /><SkeletonListItem /><SkeletonListItem /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <PlayerRow player={item} showMutuals={activeTab === 'suggested'} onToggleFollow={toggleFollow} onPress={() => navigation.navigate('UserProfile', { userId: item.id })} styles={styles} />}
          contentContainerStyle={[styles.list, filtered.length === 0 && styles.listEmpty]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>{activeTab === 'following' ? 'not following anyone yet' : 'no suggestions'}</Text></View>}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await Promise.all([loadFollowing(), loadSuggested()]); setRefreshing(false) }} tintColor={c.accent} />}
        />
      )}
    </SafeAreaView>
  )
}
