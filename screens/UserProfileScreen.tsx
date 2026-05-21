import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { colors, spacing, radius, fontSize } from '../lib/theme'
import { supabase } from '../lib/supabase'
import { RootStackParamList } from '../navigation/RootStack'

type Nav = NativeStackNavigationProp<RootStackParamList>
type RouteProps = RouteProp<RootStackParamList, 'UserProfile'>

interface UserProfile {
  id: string
  fullName: string
  bio: string | null
  handicap: number | null
  avatarUrl: string | null
  roundsPlayed: number
  bestRound: number | null
  followingCount: number
  followersCount: number
}

interface PastRound {
  id: string
  courseName: string
  date: string
  grossScore: number | null
  vsPar: number | null
}

function StatBlock({ value, label }: { value: string | number; label: string }) {
  return (
    <View style={styles.statBlock}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

export default function UserProfileScreen() {
  const navigation = useNavigation<Nav>()
  const route = useRoute<RouteProps>()
  const { userId } = route.params

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [rounds, setRounds] = useState<PastRound[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [profileRes, roundsRes, followRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, bio, handicap, avatar_url, rounds_played, best_round, following_count, followers_count')
        .eq('id', userId)
        .single(),
      supabase
        .from('rounds')
        .select('id, created_at, gross_score, vs_par, courses (name)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('follows')
        .select('follower_id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .maybeSingle(),
    ])

    if (profileRes.data) {
      const p = profileRes.data
      setProfile({
        id: p.id,
        fullName: p.full_name ?? 'Golfer',
        bio: p.bio ?? null,
        handicap: p.handicap,
        avatarUrl: p.avatar_url,
        roundsPlayed: p.rounds_played ?? 0,
        bestRound: p.best_round,
        followingCount: p.following_count ?? 0,
        followersCount: p.followers_count ?? 0,
      })
    }

    setRounds(
      (roundsRes.data ?? []).map((r: any) => ({
        id: r.id,
        courseName: r.courses?.name ?? 'Unknown course',
        date: new Date(r.created_at).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
        }),
        grossScore: r.gross_score,
        vsPar: r.vs_par,
      }))
    )

    setIsFollowing(!!followRes.data)
  }, [userId])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  async function handleFollowToggle() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !profile) return

    if (isFollowing) {
      await supabase.from('follows').delete()
        .eq('follower_id', user.id).eq('following_id', userId)
      setIsFollowing(false)
      setProfile(prev => prev ? { ...prev, followersCount: prev.followersCount - 1 } : prev)
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: userId })
      setIsFollowing(true)
      setProfile(prev => prev ? { ...prev, followersCount: prev.followersCount + 1 } : prev)
    }
  }

  const initials = (profile?.fullName ?? '?')
    .split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityRole="button">
          <Text style={styles.backText}>‹ back</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xxl }} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false) }} tintColor={colors.accent} />
          }
        >
          <View style={styles.profileHeader}>
            {profile?.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}

            <Text style={styles.name}>{profile?.fullName ?? '—'}</Text>

            {profile?.bio && (
              <Text style={styles.bio}>{profile.bio}</Text>
            )}

            {profile?.handicap != null && (
              <View style={styles.handicapRow}>
                <Text style={styles.handicapLabel}>handicap index</Text>
                <Text style={styles.handicapValue}>{profile.handicap.toFixed(1)}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.followBtn, isFollowing && styles.followingBtn]}
              onPress={handleFollowToggle}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                {isFollowing ? 'following' : 'follow'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsBar}>
            <StatBlock value={profile?.roundsPlayed ?? 0} label="rounds" />
            <View style={styles.statsDivider} />
            <StatBlock value={profile?.bestRound ?? '—'} label="best" />
            <View style={styles.statsDivider} />
            <StatBlock value={profile?.followingCount ?? 0} label="following" />
            <View style={styles.statsDivider} />
            <StatBlock value={profile?.followersCount ?? 0} label="followers" />
          </View>

          {rounds.length > 0 && (
            <View style={styles.roundsSection}>
              <Text style={styles.sectionTitle}>recent rounds</Text>
              {rounds.map(round => {
                const vsPar = round.vsPar ?? 0
                const vsParLabel = vsPar === 0 ? 'E' : vsPar > 0 ? `+${vsPar}` : `${vsPar}`
                const vsParColor = vsPar < 0 ? colors.birdie : vsPar > 5 ? colors.danger : colors.textLight
                return (
                  <View key={round.id} style={styles.roundRow}>
                    <View style={styles.roundInfo}>
                      <Text style={styles.roundCourse} numberOfLines={1}>{round.courseName}</Text>
                      <Text style={styles.roundDate}>{round.date}</Text>
                    </View>
                    <View style={styles.roundScores}>
                      <Text style={[styles.roundVsPar, { color: vsParColor }]}>{vsParLabel}</Text>
                      {round.grossScore != null && (
                        <Text style={styles.roundGross}>{round.grossScore}</Text>
                      )}
                    </View>
                  </View>
                )
              })}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { minHeight: 44, justifyContent: 'center' },
  backText: { color: colors.accent, fontSize: fontSize.md },
  profileHeader: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  avatar: { width: 88, height: 88, borderRadius: radius.full, borderWidth: 2, borderColor: colors.borderLight },
  avatarPlaceholder: {
    width: 88, height: 88, borderRadius: radius.full,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.borderLight,
  },
  avatarInitials: { color: colors.textLight, fontSize: fontSize.xl, fontWeight: '500' },
  name: { color: colors.textBright, fontSize: fontSize.xl, fontWeight: '500' },
  bio: { color: colors.muted, fontSize: fontSize.sm, textAlign: 'center', lineHeight: 20, paddingHorizontal: spacing.xl, marginTop: spacing.xs },
  handicapRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  handicapLabel: { color: colors.muted, fontSize: fontSize.sm },
  handicapValue: { color: colors.accent, fontSize: fontSize.lg, fontWeight: '500' },
  followBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.accent,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  followingBtn: { backgroundColor: colors.borderLight, borderColor: colors.borderLight },
  followBtnText: { color: colors.accent, fontSize: fontSize.md, fontWeight: '500' },
  followingBtnText: { color: colors.muted },
  statsBar: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statBlock: { flex: 1, alignItems: 'center' },
  statValue: { color: colors.textBright, fontSize: fontSize.lg, fontWeight: '500' },
  statLabel: { color: colors.muted, fontSize: fontSize.xs, marginTop: 2 },
  statsDivider: { width: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  roundsSection: { padding: spacing.md, gap: spacing.sm },
  sectionTitle: { color: colors.muted, fontSize: fontSize.sm, fontWeight: '500', marginBottom: spacing.xs },
  roundRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  roundInfo: { flex: 1, marginRight: spacing.md },
  roundCourse: { color: colors.textLight, fontSize: fontSize.md, fontWeight: '500' },
  roundDate: { color: colors.muted, fontSize: fontSize.sm, marginTop: 2 },
  roundScores: { alignItems: 'flex-end' },
  roundVsPar: { fontSize: fontSize.lg, fontWeight: '500' },
  roundGross: { color: colors.muted, fontSize: fontSize.sm, marginTop: 1 },
})
