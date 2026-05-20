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
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import * as ImagePicker from 'expo-image-picker'
import { colors, spacing, radius, fontSize, TAB_BAR_HEIGHT } from '../../lib/theme'
import { supabase } from '../../lib/supabase'
import { ProfileStackParamList } from '../../navigation/ProfileStack'

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'ProfileMain'>

interface Profile {
  id: string
  fullName: string
  handicap: number | null
  avatarUrl: string | null
  roundsPlayed: number
  bestRound: number | null
  followingCount: number
  followersCount: number
  statSlot3: StatOption
  statSlot4: StatOption
}

export type StatOption = 'following' | 'followers' | 'avg_score' | 'gir_pct' | 'fairways_pct' | 'rounds_year'

export const STAT_LABELS: Record<StatOption, string> = {
  following: 'following',
  followers: 'followers',
  avg_score: 'avg score',
  gir_pct: 'GIR %',
  fairways_pct: 'FWY %',
  rounds_year: 'this year',
}

function GolferSilhouette() {
  return (
    <View style={styles.silhouette}>
      <Text style={styles.silhouetteEmoji}>🏌️</Text>
    </View>
  )
}

function SectionRow({
  label,
  onPress,
}: {
  label: string
  onPress: () => void
}) {
  return (
    <TouchableOpacity style={styles.sectionRow} onPress={onPress} activeOpacity={0.75}>
      <Text style={styles.sectionRowLabel}>{label}</Text>
      <Text style={styles.sectionRowChevron}>›</Text>
    </TouchableOpacity>
  )
}

function StatBlock({ value, label }: { value: string | number; label: string }) {
  return (
    <View style={styles.statBlock}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function getStatValue(profile: Profile, stat: StatOption): string | number {
  switch (stat) {
    case 'following': return profile.followingCount
    case 'followers': return profile.followersCount
    case 'avg_score': return '—'
    case 'gir_pct': return '—'
    case 'fairways_pct': return '—'
    case 'rounds_year': return '—'
  }
}

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const loadProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, handicap, avatar_url, rounds_played, best_round, following_count, followers_count, stat_slot_3, stat_slot_4')
      .eq('id', user.id)
      .single()

    if (data) {
      setProfile({
        id: data.id,
        fullName: data.full_name ?? 'Golfer',
        handicap: data.handicap,
        avatarUrl: data.avatar_url,
        roundsPlayed: data.rounds_played ?? 0,
        bestRound: data.best_round,
        followingCount: data.following_count ?? 0,
        followersCount: data.followers_count ?? 0,
        statSlot3: (data.stat_slot_3 as StatOption) ?? 'following',
        statSlot4: (data.stat_slot_4 as StatOption) ?? 'followers',
      })
    }
  }, [])

  useEffect(() => {
    loadProfile().finally(() => setLoading(false))
  }, [loadProfile])

  async function handleRefresh() {
    setRefreshing(true)
    await loadProfile()
    setRefreshing(false)
  }

  async function handlePickPhoto() {
    Alert.alert('profile photo', 'choose a source', [
      {
        text: 'camera',
        onPress: () => pickImage('camera'),
      },
      {
        text: 'photo library',
        onPress: () => pickImage('library'),
      },
      { text: 'cancel', style: 'cancel' },
    ])
  }

  async function pickImage(source: 'camera' | 'library') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let result
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('permission needed', 'camera access is required to take a photo')
        return
      }
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('permission needed', 'photo library access is required')
        return
      }
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })
    }

    if (result.canceled || !result.assets[0]) return

    setUploadingPhoto(true)
    try {
      const asset = result.assets[0]
      const ext = asset.uri.split('.').pop() ?? 'jpg'
      const path = `avatars/${user.id}.${ext}`

      const response = await fetch(asset.uri)
      const blob = await response.blob()

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { upsert: true, contentType: `image/${ext}` })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path)

      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      setProfile(prev => prev ? { ...prev, avatarUrl: publicUrl } : prev)
    } catch (err) {
      Alert.alert('upload failed', 'could not save your photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xxl }} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Settings icon */}
      <TouchableOpacity
        style={styles.settingsBtn}
        onPress={() => navigation.navigate('ProfileSettings')}
        accessibilityRole="button"
        accessibilityLabel="Profile settings"
      >
        <Text style={styles.settingsIcon}>⚙</Text>
      </TouchableOpacity>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />
        }
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.8} style={styles.avatarWrapper}>
            {uploadingPhoto ? (
              <View style={styles.avatarContainer}>
                <ActivityIndicator color={colors.accent} />
              </View>
            ) : profile?.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <GolferSilhouette />
            )}
            <View style={styles.editBadge}>
              <Text style={styles.editBadgeText}>edit</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.name}>{profile?.fullName ?? '—'}</Text>

          {profile?.handicap != null && (
            <View style={styles.handicapRow}>
              <Text style={styles.handicapLabel}>handicap index</Text>
              <Text style={styles.handicapValue}>{profile.handicap.toFixed(1)}</Text>
            </View>
          )}
        </View>

        {/* Stats bar */}
        <View style={styles.statsBar}>
          <StatBlock value={profile?.roundsPlayed ?? 0} label="rounds" />
          <View style={styles.statDivider} />
          <StatBlock value={profile?.bestRound ?? '—'} label="best" />
          <View style={styles.statDivider} />
          <StatBlock
            value={profile ? getStatValue(profile, profile.statSlot3) : '—'}
            label={STAT_LABELS[profile?.statSlot3 ?? 'following']}
          />
          <View style={styles.statDivider} />
          <StatBlock
            value={profile ? getStatValue(profile, profile.statSlot4) : '—'}
            label={STAT_LABELS[profile?.statSlot4 ?? 'followers']}
          />
        </View>

        {/* Navigation sections */}
        <View style={styles.sections}>
          <SectionRow label="my bag" onPress={() => {}} />
          <SectionRow label="statistics" onPress={() => navigation.navigate('Statistics')} />
          <SectionRow label="tours" onPress={() => navigation.navigate('Tours')} />
          <SectionRow label="past rounds" onPress={() => navigation.navigate('PastRounds')} />
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.75}>
          <Text style={styles.signOutText}>sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  settingsBtn: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.md,
    zIndex: 10,
    padding: spacing.sm,
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: { color: colors.muted, fontSize: 22 },
  scrollContent: { paddingBottom: TAB_BAR_HEIGHT + spacing.md },
  avatarSection: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarWrapper: { marginBottom: spacing.md, position: 'relative' },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.borderLight,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.borderLight,
  },
  silhouette: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.borderLight,
  },
  silhouetteEmoji: { fontSize: 48 },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: colors.bg,
  },
  editBadgeText: { color: colors.bg, fontSize: fontSize.xs, fontWeight: '500' },
  name: {
    color: colors.textBright,
    fontSize: fontSize.xl,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
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
  statValue: { color: colors.textBright, fontSize: fontSize.lg, fontWeight: '500' },
  statLabel: { color: colors.muted, fontSize: fontSize.xs, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  sections: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionRowLabel: { color: colors.textBright, fontSize: fontSize.md, fontWeight: '500' },
  sectionRowChevron: { color: colors.muted, fontSize: 22, fontWeight: '300' },
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
