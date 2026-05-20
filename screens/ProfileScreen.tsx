import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, spacing, radius, fontSize, TAB_BAR_HEIGHT } from '../lib/theme'
import { Club } from '../types'
import { supabase } from '../lib/supabase'

interface Profile {
  id: string
  fullName: string
  handicap: number
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
      <Text style={styles.statBlockValue}>{value}</Text>
      <Text style={styles.statBlockLabel}>{label}</Text>
    </View>
  )
}

function ClubRow({
  club,
  onUpdateYardage,
}: {
  club: Club
  onUpdateYardage: (name: string, yardage: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(club.carryYardage))

  function commit() {
    const parsed = parseInt(draft, 10)
    if (!isNaN(parsed) && parsed >= 0) {
      onUpdateYardage(club.name, parsed)
    } else {
      setDraft(String(club.carryYardage))
    }
    setEditing(false)
  }

  if (club.name === 'Putter') {
    return (
      <View style={styles.clubRow}>
        <Text style={styles.clubName}>{club.name}</Text>
        <Text style={styles.clubYardageMuted}>—</Text>
      </View>
    )
  }

  return (
    <View style={styles.clubRow}>
      <Text style={styles.clubName}>{club.name}</Text>
      {editing ? (
        <TextInput
          style={styles.clubYardageInput}
          value={draft}
          onChangeText={setDraft}
          onBlur={commit}
          onSubmitEditing={commit}
          keyboardType="number-pad"
          autoFocus
          selectTextOnFocus
        />
      ) : (
        <TouchableOpacity onPress={() => setEditing(true)} accessibilityRole="button">
          <Text style={styles.clubYardage}>{club.carryYardage} yds</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [bag, setBag] = useState<Club[]>([])
  const [rounds, setRounds] = useState<PastRound[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [bagExpanded, setBagExpanded] = useState(false)

  const loadProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [profileRes, bagRes, roundsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, handicap, rounds_played, best_round, following_count, followers_count')
        .eq('id', user.id)
        .single(),
      supabase
        .from('clubs')
        .select('name, carry_yardage')
        .eq('user_id', user.id)
        .order('carry_yardage', { ascending: false }),
      supabase
        .from('rounds')
        .select('id, created_at, gross_score, vs_par, courses (name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    if (profileRes.data) {
      const p = profileRes.data
      setProfile({
        id: p.id,
        fullName: p.full_name ?? 'Golfer',
        handicap: p.handicap ?? 0,
        roundsPlayed: p.rounds_played ?? 0,
        bestRound: p.best_round ?? null,
        followingCount: p.following_count ?? 0,
        followersCount: p.followers_count ?? 0,
      })
    }

    setBag(
      (bagRes.data ?? []).map((c: any) => ({
        name: c.name,
        carryYardage: c.carry_yardage,
      }))
    )

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
  }, [])

  useEffect(() => {
    loadProfile().finally(() => setLoading(false))
  }, [loadProfile])

  async function handleRefresh() {
    setRefreshing(true)
    await loadProfile()
    setRefreshing(false)
  }

  async function updateYardage(name: string, yardage: number) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setBag(prev => prev.map(c => c.name === name ? { ...c, carryYardage: yardage } : c))

    await supabase
      .from('clubs')
      .update({ carry_yardage: yardage })
      .eq('user_id', user.id)
      .eq('name', name)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      </SafeAreaView>
    )
  }

  const initials = (profile?.fullName ?? '?')
    .split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />
        }
      >
        <View style={styles.profileHeader}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>{initials}</Text>
          </View>
          <Text style={styles.profileName}>{profile?.fullName ?? '—'}</Text>
          <View style={styles.handicapRow}>
            <Text style={styles.handicapLabel}>handicap index</Text>
            <Text style={styles.handicapValue}>
              {profile?.handicap != null ? profile.handicap.toFixed(1) : '—'}
            </Text>
          </View>
        </View>

        <View style={styles.statsBar}>
          <StatBlock value={profile?.roundsPlayed ?? 0} label="rounds" />
          <View style={styles.statsDivider} />
          <StatBlock value={profile?.bestRound ?? '—'} label="best round" />
          <View style={styles.statsDivider} />
          <StatBlock value={profile?.followingCount ?? 0} label="following" />
          <View style={styles.statsDivider} />
          <StatBlock value={profile?.followersCount ?? 0} label="followers" />
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setBagExpanded(v => !v)}
            activeOpacity={0.75}
            accessibilityRole="button"
          >
            <Text style={styles.sectionTitle}>my bag</Text>
            <Text style={styles.sectionChevron}>{bagExpanded ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {bagExpanded && (
            bag.length === 0 ? (
              <View style={styles.emptySection}>
                <Text style={styles.emptySectionText}>no clubs added yet</Text>
              </View>
            ) : (
              <View style={styles.bagList}>
                {bag.map(club => (
                  <ClubRow key={club.name} club={club} onUpdateYardage={updateYardage} />
                ))}
              </View>
            )
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>past rounds</Text>
          </View>
          {rounds.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>no rounds logged yet</Text>
            </View>
          ) : (
            <View style={styles.roundsList}>
              {rounds.map(round => {
                const vsPar = round.vsPar ?? 0
                const vsParLabel = vsPar === 0 ? 'E' : vsPar > 0 ? `+${vsPar}` : `${vsPar}`
                const vsParColor = vsPar < 0 ? colors.birdie : vsPar > 5 ? colors.danger : colors.textLight
                return (
                  <TouchableOpacity key={round.id} style={styles.roundRow} activeOpacity={0.75}>
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
                  </TouchableOpacity>
                )
              })}
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.75}>
          <Text style={styles.signOutText}>sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loader: { marginTop: spacing.xxl },
  scrollContent: { paddingBottom: TAB_BAR_HEIGHT + spacing.md },
  profileHeader: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  profileAvatarText: { color: colors.textLight, fontSize: fontSize.xl, fontWeight: '500' },
  profileName: { color: colors.textBright, fontSize: fontSize.xl, fontWeight: '500', marginBottom: spacing.sm },
  handicapRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  handicapLabel: { color: colors.muted, fontSize: fontSize.sm },
  handicapValue: { color: colors.accent, fontSize: fontSize.lg, fontWeight: '500' },
  statsBar: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statBlock: { flex: 1, alignItems: 'center' },
  statBlockValue: { color: colors.textBright, fontSize: fontSize.lg, fontWeight: '500' },
  statBlockLabel: { color: colors.muted, fontSize: fontSize.xs, marginTop: 2 },
  statsDivider: { width: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  section: { borderBottomWidth: 1, borderBottomColor: colors.border },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 52,
  },
  sectionTitle: { color: colors.textBright, fontSize: fontSize.md, fontWeight: '500' },
  sectionChevron: { color: colors.muted, fontSize: fontSize.xs },
  emptySection: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  emptySectionText: { color: colors.inactive, fontSize: fontSize.sm },
  bagList: { paddingBottom: spacing.sm },
  clubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 48,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  clubName: { color: colors.textLight, fontSize: fontSize.md },
  clubYardage: {
    color: colors.accent,
    fontSize: fontSize.md,
    fontWeight: '500',
    minWidth: 70,
    textAlign: 'right',
    lineHeight: 44,
    minHeight: 44,
  },
  clubYardageMuted: { color: colors.inactive, fontSize: fontSize.md, minWidth: 70, textAlign: 'right' },
  clubYardageInput: {
    color: colors.accent,
    fontSize: fontSize.md,
    fontWeight: '500',
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
    minWidth: 70,
    textAlign: 'right',
    paddingVertical: 2,
    minHeight: 44,
  },
  roundsList: { paddingBottom: spacing.sm },
  roundRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 60,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  roundInfo: { flex: 1, marginRight: spacing.md },
  roundCourse: { color: colors.textLight, fontSize: fontSize.md, fontWeight: '500' },
  roundDate: { color: colors.muted, fontSize: fontSize.sm, marginTop: 2 },
  roundScores: { alignItems: 'flex-end' },
  roundVsPar: { fontSize: fontSize.lg, fontWeight: '500' },
  roundGross: { color: colors.muted, fontSize: fontSize.sm, marginTop: 1 },
  signOutBtn: {
    margin: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    minHeight: 52,
    justifyContent: 'center',
  },
  signOutText: { color: colors.muted, fontSize: fontSize.md },
})
