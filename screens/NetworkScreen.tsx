import React, { useState } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
} from 'react-native'
import { colors, spacing, radius, fontSize, TAB_BAR_HEIGHT } from '../lib/theme'
import { Player } from '../types'

type NetworkTab = 'following' | 'suggested'

interface NetworkPlayer extends Player {
  avatarUrl: string | null
  homeCourse: string | null
  lastRound: string | null
  mutuals: number
  isFollowing: boolean
}

const MOCK_FOLLOWING: NetworkPlayer[] = [
  {
    id: 'u1',
    name: 'James McKenna',
    handicap: 8,
    avatarUrl: null,
    homeCourse: 'Pebble Beach Golf Links',
    lastRound: '2d ago',
    mutuals: 0,
    isFollowing: true,
  },
  {
    id: 'u2',
    name: 'Sarah Callahan',
    handicap: 14,
    avatarUrl: null,
    homeCourse: 'Augusta National Golf Club',
    lastRound: '5d ago',
    mutuals: 0,
    isFollowing: true,
  },
  {
    id: 'u3',
    name: 'Ryan Park',
    handicap: 3,
    avatarUrl: null,
    homeCourse: 'Bethpage Black',
    lastRound: '1w ago',
    mutuals: 0,
    isFollowing: true,
  },
]

const MOCK_SUGGESTED: NetworkPlayer[] = [
  {
    id: 'u5',
    name: 'Daniel Osei',
    handicap: 6,
    avatarUrl: null,
    homeCourse: 'TPC Sawgrass',
    lastRound: '3d ago',
    mutuals: 4,
    isFollowing: false,
  },
  {
    id: 'u6',
    name: 'Meghan Torres',
    handicap: 11,
    avatarUrl: null,
    homeCourse: 'Torrey Pines Golf Course',
    lastRound: '1d ago',
    mutuals: 2,
    isFollowing: false,
  },
  {
    id: 'u7',
    name: 'Connor Walsh',
    handicap: 1,
    avatarUrl: null,
    homeCourse: 'Augusta National Golf Club',
    lastRound: 'today',
    mutuals: 7,
    isFollowing: false,
  },
  {
    id: 'u8',
    name: 'Priya Nair',
    handicap: 18,
    avatarUrl: null,
    homeCourse: 'Poppy Hills Golf Course',
    lastRound: '4d ago',
    mutuals: 1,
    isFollowing: false,
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

function PlayerRow({
  player,
  onToggleFollow,
  showMutuals,
}: {
  player: NetworkPlayer
  onToggleFollow: (id: string) => void
  showMutuals: boolean
}) {
  return (
    <TouchableOpacity style={styles.playerRow} activeOpacity={0.75}>
      <Avatar name={player.name} />
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>{player.name}</Text>
        <Text style={styles.playerMeta}>
          hcp {player.handicap}
          {player.homeCourse ? ` · ${player.homeCourse}` : ''}
        </Text>
        {showMutuals && player.mutuals > 0 && (
          <Text style={styles.playerMutuals}>
            {player.mutuals} mutual{player.mutuals !== 1 ? 's' : ''}
          </Text>
        )}
        {!showMutuals && player.lastRound && (
          <Text style={styles.playerLastRound}>last round {player.lastRound}</Text>
        )}
      </View>
      <TouchableOpacity
        style={[styles.followBtn, player.isFollowing && styles.followingBtn]}
        onPress={() => onToggleFollow(player.id)}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={player.isFollowing ? 'Unfollow' : 'Follow'}
      >
        <Text
          style={[
            styles.followBtnText,
            player.isFollowing && styles.followingBtnText,
          ]}
        >
          {player.isFollowing ? 'following' : 'follow'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  )
}

export default function NetworkScreen() {
  const [activeTab, setActiveTab] = useState<NetworkTab>('following')
  const [search, setSearch] = useState('')
  const [following, setFollowing] = useState(MOCK_FOLLOWING)
  const [suggested, setSuggested] = useState(MOCK_SUGGESTED)

  function toggleFollow(id: string) {
    setFollowing(prev =>
      prev.map(p => (p.id === id ? { ...p, isFollowing: !p.isFollowing } : p))
    )
    setSuggested(prev =>
      prev.map(p => (p.id === id ? { ...p, isFollowing: !p.isFollowing } : p))
    )
  }

  const data = activeTab === 'following' ? following : suggested
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
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'following' && styles.tabBtnActive]}
          onPress={() => setActiveTab('following')}
          accessibilityRole="tab"
        >
          <Text
            style={[
              styles.tabBtnText,
              activeTab === 'following' && styles.tabBtnTextActive,
            ]}
          >
            following
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'suggested' && styles.tabBtnActive]}
          onPress={() => setActiveTab('suggested')}
          accessibilityRole="tab"
        >
          <Text
            style={[
              styles.tabBtnText,
              activeTab === 'suggested' && styles.tabBtnTextActive,
            ]}
          >
            suggested
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <PlayerRow
            player={item}
            onToggleFollow={toggleFollow}
            showMutuals={activeTab === 'suggested'}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
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
  searchRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
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
  tabBtnActive: {
    borderBottomColor: colors.accent,
  },
  tabBtnText: {
    color: colors.muted,
    fontSize: fontSize.md,
    fontWeight: '400',
  },
  tabBtnTextActive: {
    color: colors.accent,
    fontWeight: '500',
  },
  list: {
    paddingBottom: TAB_BAR_HEIGHT + spacing.md,
  },
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
  avatarText: {
    color: colors.textLight,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    color: colors.textBright,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  playerMeta: {
    color: colors.muted,
    fontSize: fontSize.sm,
    marginTop: 1,
  },
  playerMutuals: {
    color: colors.inactive,
    fontSize: fontSize.xs,
    marginTop: 1,
  },
  playerLastRound: {
    color: colors.inactive,
    fontSize: fontSize.xs,
    marginTop: 1,
  },
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
  followingBtn: {
    borderColor: colors.borderLight,
    backgroundColor: colors.borderLight,
  },
  followBtnText: {
    color: colors.accent,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  followingBtnText: {
    color: colors.muted,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.md + 46 + spacing.sm,
  },
})
